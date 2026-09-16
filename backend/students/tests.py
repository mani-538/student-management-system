from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Student


class StudentAPITests(APITestCase):
    def setUp(self):
        self.student1 = Student.objects.create(
            name="Alice Smith",
            email="alice@example.com",
            course="Computer Science",
            age=20
        )
        self.list_url = reverse('student-list')
        self.detail_url = reverse('student-detail', kwargs={'pk': self.student1.pk})

    def test_create_valid_student(self):
        """Test creating a student with valid data."""
        data = {
            "name": "Bob Jones",
            "email": "BOB@example.com",
            "course": "Mathematics",
            "age": 22
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Bob Jones")
        self.assertEqual(response.data['email'], "bob@example.com")
        self.assertEqual(response.data['course'], "Mathematics")
        self.assertEqual(response.data['age'], 22)
        self.assertIn('id', response.data)

    def test_list_students(self):
        """Test listing all students."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Alice Smith")

    def test_retrieve_single_student(self):
        """Test retrieving a single student by ID."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "alice@example.com")

    def test_update_student(self):
        """Test updating a student via PUT and PATCH."""
        put_data = {
            "name": "Alice Johnson",
            "email": "alice_updated@example.com",
            "course": "Data Science",
            "age": 21
        }
        response = self.client.put(self.detail_url, put_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Alice Johnson")
        self.assertEqual(response.data['email'], "alice_updated@example.com")

        patch_data = {"age": 22}
        response = self.client.patch(self.detail_url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['age'], 22)

    def test_delete_student(self):
        """Test deleting a student."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(pk=self.student1.pk).exists())

    def test_empty_required_fields(self):
        """Test validation failure for empty or whitespace-only required fields."""
        data = {
            "name": "   ",
            "email": "valid@example.com",
            "course": "",
            "age": 20
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('course', response.data)

    def test_invalid_email_format(self):
        """Test validation failure for invalid email format."""
        data = {
            "name": "Charlie",
            "email": "not-an-email",
            "course": "Physics",
            "age": 19
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_duplicate_email(self):
        """Test validation failure for duplicate email."""
        data = {
            "name": "Alice Duplicate",
            "email": "ALICE@example.com",
            "course": "Chemistry",
            "age": 20
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_age_below_minimum(self):
        """Test validation failure when age is below 16."""
        data = {
            "name": "Young Student",
            "email": "young@example.com",
            "course": "Arts",
            "age": 15
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('age', response.data)

    def test_age_above_maximum(self):
        """Test validation failure when age is above 100."""
        data = {
            "name": "Elderly Student",
            "email": "elderly@example.com",
            "course": "History",
            "age": 101
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('age', response.data)

    def test_nonexistent_student_id(self):
        """Test 404 response when requesting a nonexistent student ID."""
        nonexistent_url = reverse('student-detail', kwargs={'pk': 99999})
        response = self.client.get(nonexistent_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
