# Deployment Guide: PythonAnywhere

This guide provides step-by-step instructions for deploying the **Student Management System** to [PythonAnywhere](https://www.pythonanywhere.com/).

---

## 📋 Prerequisites
1. A PythonAnywhere account (Free / Beginner tier or higher).
2. GitHub repository URL: `https://github.com/mani-538/student-management-system.git`

---

## 🚀 Deployment Steps

### 1. Clone the Repository on PythonAnywhere
Open a **Bash Console** in PythonAnywhere and run:

```bash
git clone https://github.com/mani-538/student-management-system.git
cd student-management-system
```

### 2. Create Virtual Environment & Install Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the project root directory or configure WSGI environment variables:

```bash
cp .env.example .env
nano .env
```

Set appropriate production values in `.env`:
```ini
DJANGO_SECRET_KEY=your-generated-50-character-production-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourusername.pythonanywhere.com
```

### 4. Run Migrations & Collect Static Files
```bash
python backend/manage.py migrate
python backend/manage.py collectstatic --noinput
```

### 5. Configure PythonAnywhere Web App
1. Go to the **Web** tab in PythonAnywhere dashboard.
2. Click **Add a new web app**.
3. Select **Manual configuration** and choose **Python 3.10+**.
4. Set up the **Virtualenv**:
   - Path: `/home/yourusername/student-management-system/.venv`

### 6. Configure WSGI Configuration File
Click on the **WSGI configuration file** link in the Web tab and set its contents to:

```python
import os
import sys

# Add project root and backend to python path
project_folder = '/home/yourusername/student-management-system'
backend_folder = '/home/yourusername/student-management-system/backend'

if project_folder not in sys.path:
    sys.path.insert(0, project_folder)
if backend_folder not in sys.path:
    sys.path.insert(0, backend_folder)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(project_folder, '.env'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```
*(Replace `yourusername` with your actual PythonAnywhere username).*

### 7. Configure Static Files Mapping on PythonAnywhere
In the **Static files** section of the Web tab, add the mapping:

| URL | Path |
| :--- | :--- |
| `/static/` | `/home/yourusername/student-management-system/backend/staticfiles` |

### 8. Reload Web App
Click the green **Reload** button at the top of the Web tab. Your application will be live at:
`https://yourusername.pythonanywhere.com/`

---

## 🧪 Post-Deployment Verification Checklist
- [ ] Visit `https://yourusername.pythonanywhere.com/` and confirm the frontend loads cleanly.
- [ ] Test creating, editing, searching, and deleting student records.
- [ ] Check `https://yourusername.pythonanywhere.com/api/students/` to verify DRF endpoints respond correctly.
