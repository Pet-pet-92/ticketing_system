from rest_framework import serializers
from .models import (
    Ticket, TicketComment, TicketCategory, TicketType, 
    Department, PriorityRule, SLA
)
from django.contrib.auth.models import User, Group, Permission


class TicketCommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = TicketComment
        fields = ['id', 'user', 'comment', 'created_at']


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = ['id', 'name', 'description', 'is_active']


class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketType
        fields = ['id', 'name', 'description', 'is_active']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active']


class PriorityRuleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    type_name = serializers.CharField(source='type.name', read_only=True)
    
    class Meta:
        model = PriorityRule
        fields = [
            'id', 'category', 'category_name', 'type', 'type_name',
            'keyword', 'priority', 'order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SLASerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = SLA
        fields = [
            'id', 'name', 'description', 'priority', 'priority_display',
            'response_time_minutes', 'resolution_time_minutes',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ============================================
# TICKET SERIALIZER
# ============================================
class TicketSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    assigned_to = serializers.StringRelatedField()
    
    category = serializers.PrimaryKeyRelatedField(
        queryset=TicketCategory.objects.all(),
        allow_null=True
    )
    type = serializers.PrimaryKeyRelatedField(
        queryset=TicketType.objects.all(),
        allow_null=True
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        allow_null=True
    )
    
    is_open = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description', 'status', 'priority',
            'category', 'type', 'department',
            'created_by',      
            'assigned_to',     
            'created_at', 'updated_at', 'resolved_at',
            'is_open',           
            'comment_count',     
        ]
        read_only_fields = [
            'ticket_number', 'created_by', 'assigned_to',
            'created_at', 'updated_at', 'resolved_at', 
            'priority', 'status'
        ]

    def get_is_open(self, obj):
        return obj.is_open

    def get_comment_count(self, obj):
        return obj.comment_count


# ============================================
# USER SERIALIZERS
# ============================================
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser',
            'role', 'groups', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def get_role(self, obj):
        if obj.is_superuser:
            return 'Admin'
        if obj.groups.filter(name='Support_Agent').exists():
            return 'Support_Agent'
        return 'User'


# ============================================
# USER CREATE/UPDATE SERIALIZER (UPDATED)
# ============================================
class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField(write_only=True, required=False, default='User')
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'is_active', 'is_staff', 'is_superuser',
            'role'
        ]
        extra_kwargs = {
            'password': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        role = validated_data.pop('role', 'User')
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Set a temporary password if none provided (shouldn't happen for create)
            user.set_password('TemporaryPass123!')
        user.save()
        
        # Assign role
        self._assign_role(user, role)
        
        return user
    
    def update(self, instance, validated_data):
        # Extract role and password
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Handle role update if provided
        if role:
            self._assign_role(instance, role)
        
        return instance
    
    def _assign_role(self, user, role):
        """Helper to assign role to user"""
        # Remove from all groups
        user.groups.clear()
        
        if role == 'Admin':
            user.is_superuser = True
            user.is_staff = True
            group, _ = Group.objects.get_or_create(name='Admin')
            user.groups.add(group)
        elif role == 'Support_Agent':
            user.is_superuser = False
            user.is_staff = True
            group, _ = Group.objects.get_or_create(name='Support_Agent')
            user.groups.add(group)
        else:  # User
            user.is_superuser = False
            user.is_staff = False
            group, _ = Group.objects.get_or_create(name='User')
            user.groups.add(group)
        
        user.save()


# ============================================
# ROLE (GROUP) SERIALIZERS
# ============================================
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type__app_label']


class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'user_count']
    
    def get_permissions(self, obj):
        return [p.name for p in obj.permissions.all()]
    
    def get_user_count(self, obj):
        return obj.user_set.count()


class GroupCreateSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Group
        fields = ['name', 'permissions']
    
    def create(self, validated_data):
        permissions = validated_data.pop('permissions', [])
        group = Group.objects.create(name=validated_data['name'])
        for perm_id in permissions:
            try:
                perm = Permission.objects.get(id=perm_id)
                group.permissions.add(perm)
            except Permission.DoesNotExist:
                pass
        return group
    
    def update(self, instance, validated_data):
        permissions = validated_data.pop('permissions', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        if permissions is not None:
            instance.permissions.clear()
            for perm_id in permissions:
                try:
                    perm = Permission.objects.get(id=perm_id)
                    instance.permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
        return instance