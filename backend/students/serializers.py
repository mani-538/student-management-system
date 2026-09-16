from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'course', 'age', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty or contain only spaces.")
        return value.strip()

    def validate_course(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Course cannot be empty or contain only spaces.")
        return value.strip()

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty or contain only spaces.")
        
        normalized_email = value.strip().lower()

        # Check uniqueness manually to give a clean message & handle case-insensitivity
        qs = Student.objects.filter(email__iexact=normalized_email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        
        if qs.exists():
            raise serializers.ValidationError("A student with this email address already exists.")

        return normalized_email

    def validate_age(self, value):
        if value is None:
            raise serializers.ValidationError("Age is required.")
        if value < 16 or value > 100:
            raise serializers.ValidationError("Age must be between 16 and 100.")
        return value
