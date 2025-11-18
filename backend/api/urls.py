# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PromptViewSet,
    RegisterView,
    CategoryListView,
    CompanySSOView,
    PromoteAdminView,
    CurrentUserView, 
    BookmarkToggleView,
)

router = DefaultRouter()
router.register(r'prompts', PromptViewSet, basename='prompt')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('auth/promote-admin/', PromoteAdminView.as_view(), name='promote-admin'),
    path('auth/company-sso/', CompanySSOView.as_view(), name='company-sso'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    # path('prompts/<int:pk>/vote/', VoteToggleView.as_view(), name='prompt-vote'),
    path('prompts/<int:pk>/upvote/', PromptViewSet.as_view({'post': 'upvote'}), name='prompt-upvote'),
    path('prompts/<int:pk>/downvote/', PromptViewSet.as_view({'post': 'downvote'}), name='prompt-downvote'),
    path('prompts/<int:pk>/bookmark/', BookmarkToggleView.as_view(), name='prompt-bookmark'),
    path('prompts/<int:pk>/history/', PromptViewSet.as_view({'get': 'history'}), name='prompt-history'),
]
