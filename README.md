# BrainScanner

BrainScanner is a system that enables easy and intuitive use of an innovative neural network algorithm to classify three types of brain tumors: glioma, meningioma, and pituitary tumor, as well as to recognize images that do not indicate the presence of any of the aforementioned pathologies. At the same time, it does not require programming skills or technical knowledge of deep learning. These are key features of the application, as it has been designed for implementation in a medical facility, where it could be used to assist doctors in diagnosing brain tumors.

Another advantage of the system is its easy accessibility, as the application does not need to be installed on the user's device. Access is provided via a web browser on a computer connected to an authorized network. This significantly streamlines the onboarding process for new users. The installation, deployment, and potential migration of the application are also simplified through the use of containerization technology.

To facilitate access to analyzed images, BrainScanner stores them in the file system and associates them with patient data. Additionally, it allows doctors to share knowledge by labeling images that have been confirmed to contain one of the diagnosed classes. Classified images can later be used to train a new model.

Each time the algorithm is used, the system saves the obtained predictions to a database. The stored data can later be used to assess the model’s classification capabilities in a real medical environment.
## User Perspective

### Authentication and Access
Every time a user attempts to access the application without being logged in, they are redirected to the login page. After successful authentication, the user can access the application for the duration specified in the JWT token lifetime settings in the `settings.py` file or until they manually log out. The logout option is available on every page of the application and immediately terminates the user session.
![Logowanie](https://github.com/user-attachments/assets/35427ce4-ed2b-4363-8116-5b4eebda9820)

After logging in, the user is redirected to the main dashboard, which provides an introduction to key system functions along with quick access links. A navigation bar is available on all pages, allowing users to switch between the home page, analysis history, report history, and forms for analyzing single or multiple MRI images. On the right side of the navigation bar, the user’s name is displayed, which, when clicked, expands a menu with options to change the password, view account information, and log out.
![Strona główna + navbar](https://github.com/user-attachments/assets/53cf3ffb-5316-46da-8000-8ef2387fe9e3)

### Changing Password
On the password change page, users must enter and confirm their new password. The system only updates the password if both fields match and the new password differs from the previous one. If these conditions are not met, an appropriate error message is displayed. Upon a successful password change, the user is logged out automatically.
![Zmiana hasła](https://github.com/user-attachments/assets/4a5e0282-6983-42b6-b50d-918865e7a2fd)

### Image Upload and Analysis
Users can upload MRI images for analysis through a dedicated form. The uploaded images are automatically cropped and resized to fit the model's requirements, eliminating the need for manual adjustments.
![Single](https://github.com/user-attachments/assets/fe209c0a-8912-47f7-9b4c-800722449c59)

Patient information can be entered manually or selected from an existing database. If entering details manually, the user must provide a valid PESEL number and email address, both of which are verified for uniqueness. Only one image can be uploaded at a time, and it must be in PNG format with a maximum size of 4MB. Once uploaded, the system displays the model’s prediction results in percentage form. If the patient’s data was entered manually and the image does not already exist in the system, the information is stored for future reference.

The system also checks whether the uploaded image is already linked to another patient. If a conflict is detected, the user is notified.
![Wynik single](https://github.com/user-attachments/assets/2f8cdbbd-853e-4c36-852e-1bdb352961cf)

### Multiple Images Analysis
Users can also analyze multiple images simultaneously through a dedicated form. This process is similar to single-image analysis but allows for multiple patients and up to five images per patient. Data validation follows the same rules as for single-image analysis. After processing, users receive a summary with an option to open or download a detailed report.
![multiple](https://github.com/user-attachments/assets/3dc3f8ae-6000-4ca5-b1e0-6eac7a9ac97c)

Analysis reports are generated in TXT format and include details about each patient and their analyzed images, along with model predictions. The results are sorted based on the confidence level of the model’s predictions.
![Raport (1)](https://github.com/user-attachments/assets/b8c0b3e8-e58c-4841-9429-7c993ceba6d2)

### Reports and History
The history page displays all previous analyses, including both single and batch image analyses. Each entry contains the analyzed image, date of analysis, patient details, model predictions, and assigned labels. Initially, images are labeled as "unknown." If a user confirms a diagnosis, they can assign a label, which is irreversible. Once labeled, the image is automatically added to the model’s dataset.
![historia](https://github.com/user-attachments/assets/3e5d196b-bfb4-4f1d-a3e6-f73a11b5dd5b)

The history page also allows users to enlarge images, download them, and filter entries by patient name or label.

A separate page provides access to the history of generated reports, displaying the report creation date and a list of patients with their associated images. Reports can be opened in a new window or downloaded. A search function allows users to filter reports by patient name.
![Historia raportów](https://github.com/user-attachments/assets/ce1b4c49-647e-41c1-be23-2b114d28f176)

### Admin Features
Administrators have access to additional pages for managing user accounts. They can create new user accounts by filling out a form that verifies the PESEL number, email address, and ensures that the login credentials are unique. If all data is valid, the system generates a random password and sends it via email in an encrypted file, with the PESEL number as the encryption key.

Administrators can also correct errors by editing user data, resetting passwords (which are automatically emailed to users), and modifying patient details. Additionally, they can reassign images to different patients or update image labels.
![Zmiana zdjęcia](https://github.com/user-attachments/assets/447c39fa-0148-42fe-8568-0a87b55f9cc4)

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
