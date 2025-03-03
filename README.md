# BrainScanner

BrainScanner is a system that enables easy and intuitive use of an innovative neural network algorithm to classify three types of brain tumors: glioma, meningioma, and pituitary tumor, as well as to recognize images that do not indicate the presence of any of the aforementioned pathologies. At the same time, it does not require programming skills or technical knowledge of deep learning. These are key features of the application, as it has been designed for implementation in a medical facility, where it could be used to assist doctors in diagnosing brain tumors.

Another advantage of the system is its easy accessibility, as the application does not need to be installed on the user's device. Access is provided via a web browser on a computer connected to an authorized network. This significantly streamlines the onboarding process for new users. The installation, deployment, and potential migration of the application are also simplified through the use of containerization technology.

To facilitate access to analyzed images, BrainScanner stores them in the file system and associates them with patient data. Additionally, it allows doctors to share knowledge by labeling images that have been confirmed to contain one of the diagnosed classes. Classified images can later be used to train a new model.

Each time the algorithm is used, the system saves the obtained predictions to a database. The stored data can later be used to assess the model’s classification capabilities in a real medical environment.
## Installation and Deployment

To install and run BrainScanner, follow these steps:

### 1. Create and Configure Django Settings File

Ensure that a `settings.py` file is created in the Django backend. Modify or add the following configurations:

- **REST API settings:**

  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': (
          'api.auth.CookiesJWTAuthentication',
      ),
      'DEFAULT_PERMISSION_CLASSES': [
          'rest_framework.permissions.IsAuthenticated',
      ],
  }
  ```

- **Media files settings:**

  ```python
  MEDIA_URL = "/media/"
  MEDIA_ROOT = BASE_DIR / "media"
  ```

- **Email settings (should be configured manually):**

  ```python
  EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
  EMAIL_HOST = 'smtp.gmail.com'
  EMAIL_USE_TLS = True
  EMAIL_PORT = 587
  EMAIL_HOST_USER = ''  # Provide email user
  EMAIL_HOST_PASSWORD = ''  # Provide email password
  ```

Make sure to update the email settings with your credentials.

- **Database settings (configure according to the database being used):**
  ```python
  DATABASES = {
      "default": {
          "ENGINE": '',  # Provide engine
          "NAME": '',  # Provide database name
          "USER": '',  # Provide user name
          "PASSWORD": '',  # Provide user password
          "HOST": '',  # Provide host
          "PORT": '',  # Provide host's port
      }
  }
  ```

### 2. Build the Frontend Application

Navigate to the frontend directory and build the application:

```sh
cd frontend
npm install
npm run build
```

Move the build files to the backend folder:

```sh
mv build ../backend/build
```

### 3. Deploy the Application

From the root of the project, execute the following command to start the application using Docker Compose:

```sh
docker-compose -f docker-compose.yml up -d --build
```

This command will build and start all necessary services in the background.

BrainScanner system should now be up and running, accessible through a web browser on an authorized network.
