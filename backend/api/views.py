from rest_framework import viewsets, permissions, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Vote, Bookmark, PromptVersion, Prompt, CATEGORY_CHOICES
from .serializers import PromptSerializer, PromptVersionSerializer, UserSerializer


# Custom permission
# Custom permission - FIXED VERSION

class IsAdminOrOwner(permissions.BasePermission):

    """

    Custom permission to allow:

    - Admins can do anything

    - Owners can view/edit their own prompts

    - Anyone authenticated can read (GET)

    """

    def has_permission(self, request, view):

        """

        ✅ FIXED: Added has_permission for list-level checks

        This is called BEFORE has_object_permission

        """

        # Allow authenticated users to proceed

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        """

        Object-level permission check

        """

        # Admins can do anything

        if request.user.is_staff:

            return True

        # Allow safe methods (GET, HEAD, OPTIONS) for everyone

        if request.method in permissions.SAFE_METHODS:

            return True

        # For write operations, must be the owner

        return obj.user == request.user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        predefined_categories = [choice[0] for choice in CATEGORY_CHOICES]
        user_categories = list(
            request.user.prompts.all()
            .values_list('category', flat=True)
            .distinct()
        )
        all_categories = sorted(list(set(predefined_categories + user_categories)))
        return Response(all_categories)


class CompanySSOView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        sso_login_url = ""
        return Response({'sso_authorization_url': sso_login_url})


class PromoteAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user_to_promote = get_object_or_404(User, username=username)
        if user_to_promote.is_staff:
            return Response({'message': f'User "{username}" is already an admin.'}, status=status.HTTP_400_BAD_REQUEST)
        user_to_promote.is_staff = True
        user_to_promote.save()
        return Response({'message': f'Successfully promoted user "{username}" to admin.'})


class CurrentUserView(APIView):
    """
    Returns current user's basic details for frontend (id, username, email, is_staff).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
        })


class PromptViewSet(viewsets.ModelViewSet):
    serializer_class = PromptSerializer
    queryset = Prompt.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'task_type', 'output_format', 'status']
    search_fields = ['title', 'prompt_description', 'prompt_text']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Prompt.objects.all().order_by('-created_at')
        if self.request.query_params.get('mine') == '1':
            return Prompt.objects.filter(Q(status='approved') | Q(user=user)).order_by('-created_at')
        return Prompt.objects.filter(status='approved').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """
        Override the default update behavior.
        - Create a PromptVersion snapshot BEFORE saving.
        - If user is NON-ADMIN, set status to 'pending'.
        - If user is ADMIN, save changes as-is.
        """
        prompt_before_edit = self.get_object()

        # Create a history snapshot ONLY if the version being edited was 'approved'
        if prompt_before_edit.status == 'approved':
            PromptVersion.objects.create(
                prompt=prompt_before_edit,
                edited_by=self.request.user,
                title=prompt_before_edit.title,
                prompt_description=prompt_before_edit.prompt_description,
                prompt_text=prompt_before_edit.prompt_text,
                guidance=prompt_before_edit.guidance,
                task_type=prompt_before_edit.task_type,
                output_format=prompt_before_edit.output_format,
                category=prompt_before_edit.category
            )

        # Save the new changes
        if not self.request.user.is_staff:
            serializer.save(status='pending')
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        prompt = self.get_object()
        if prompt.status == 'approved':
            return Response({'detail': 'Prompt is already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        prompt.status = 'approved'
        prompt.save()
        return Response(PromptSerializer(prompt).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        prompt = self.get_object()
        if prompt.status == 'rejected':
            return Response({'detail': 'Prompt is already rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        prompt.status = 'rejected'
        prompt.save()
        return Response(PromptSerializer(prompt).data)

    # ✅ FIXED: Consolidated vote logic with proper transaction handling
    def _handle_vote(self, request, pk, value_to_set):
        """
        Internal helper function to handle all vote logic.
        `value_to_set` should be 1 for upvote, -1 for downvote.
        """
        prompt = self.get_object()
        user = request.user

        with transaction.atomic():
            existing = Vote.objects.filter(user=user, prompt=prompt).first()

            if existing is None:
                # No vote exists, create one
                Vote.objects.create(user=user, prompt=prompt, value=value_to_set)
            else:
                if existing.value == value_to_set:
                    # User is clicking the same button again (un-voting)
                    existing.delete()
                else:
                    # User is switching their vote (e.g., down -> up)
                    existing.value = value_to_set
                    existing.save()

            # Refresh prompt from database to get latest vote counts
            prompt.refresh_from_db()
            
            # Calculate new counts
            likes = prompt.votes.filter(value=1).count()
            dislikes = prompt.votes.filter(value=-1).count()

            # Update aggregate fields
            prompt.like_count = likes
            prompt.dislike_count = dislikes
            prompt.vote = likes - dislikes
            
            prompt.save(update_fields=['like_count', 'dislike_count', 'vote'])

        # Return the fully updated prompt
        serializer = PromptSerializer(prompt, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upvote(self, request, pk=None):
        """
        Handles POST to /prompts/<pk>/upvote/
        Toggles an upvote (value=1) for the current user.
        """
        return self._handle_vote(request, pk, value_to_set=1)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def downvote(self, request, pk=None):
        """
        Handles POST to /prompts/<pk>/downvote/
        Toggles a downvote (value=-1) for the current user.
        """
        return self._handle_vote(request, pk, value_to_set=-1)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def history(self, request, pk=None):
        """
        Returns the edit history for a prompt.
        ✅ FIXED: Changed permission to IsAuthenticated and added owner check inside
        """
        prompt = self.get_object()
        # Check if user is owner or admin
        if not request.user.is_staff and prompt.user != request.user:
            return Response(
                {'detail': 'You do not have permission to view this history.'},
                status=status.HTTP_403_FORBIDDEN
            )
        versions = prompt.versions.all()
        serializer = PromptVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["post"], url_path="request-delete", url_name="request_delete")
    def request_delete(self, request, pk=None):
        """
        User requests deletion -> set status to 'pending_deletion'.
        Returns 202 Accepted with updated prompt object.
        """
        prompt = self.get_object()

        # Only allow owner to request deletion
        if request.user.is_authenticated:
            if prompt.user and request.user != prompt.user and not request.user.is_staff:
                return Response({"detail": "Only the owner can request deletion."}, status=status.HTTP_403_FORBIDDEN)

        prompt.status = "pending_deletion"
        prompt.save()

        serializer = self.get_serializer(prompt)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["post"], url_path="review-delete", url_name="review_delete", permission_classes=[IsAdminUser])
    def review_delete(self, request, pk=None):
        """
        Admin endpoint to review a pending deletion request.
        POST body: { "action": "approve" }  OR { "action": "reject" }
        """
        prompt = self.get_object()
        action_choice = request.data.get("action", "").lower()

        if action_choice not in ("approve", "reject"):
            return Response({"detail": "Invalid action. Must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        if action_choice == "reject":
            prompt.status = "approved"
            prompt.save()
            serializer = self.get_serializer(prompt)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if action_choice == "approve":
            prompt.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOwner], url_path='revert/(?P<version_id>\\d+)')
    def revert(self, request, pk=None, version_id=None):
        """
        Reverts the main prompt to a specific historical version.
        POST /api/prompts/<pk>/revert/<version_id>/
        Only the owner or an admin can do this.
        """
        prompt = self.get_object()
        version = get_object_or_404(PromptVersion, pk=version_id)

        # Security check: Ensure version belongs to this prompt
        if version.prompt != prompt:
            return Response(
                {'error': 'Version does not belong to this prompt.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a snapshot of the current state before reverting
        if prompt.status == 'approved':
            PromptVersion.objects.create(
                prompt=prompt,
                edited_by=request.user,
                title=prompt.title,
                prompt_description=prompt.prompt_description,
                prompt_text=prompt.prompt_text,
                guidance=prompt.guidance,
                task_type=prompt.task_type,
                output_format=prompt.output_format,
                category=prompt.category
            )
        
        # Apply the old version's data to the main prompt
        prompt.title = version.title
        prompt.prompt_description = version.prompt_description
        prompt.prompt_text = version.prompt_text
        prompt.guidance = version.guidance
        prompt.task_type = version.task_type
        prompt.output_format = version.output_format
        prompt.category = version.category
        
        # If a non-admin reverts, it must go to pending for re-approval
        if not request.user.is_staff:
            prompt.status = 'pending'
        
        prompt.save()
        
        serializer = self.get_serializer(prompt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        """
        Toggle bookmark for the current user on prompt pk.
        Returns serialized Prompt (so frontend can update UI).
        """
        prompt = get_object_or_404(Prompt, pk=pk)
        user = request.user

        existing = prompt.bookmarks.filter(user=user).first()
        if existing is None:
            Bookmark.objects.create(user=user, prompt=prompt)
        else:
            existing.delete()

        serializer = PromptSerializer(prompt, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
