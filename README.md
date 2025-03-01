# BrainScanner

BrainScanner is a system that enables easy and intuitive use of an innovative neural network algorithm to classify three types of brain tumors: glioma, meningioma, and pituitary tumor, as well as to recognize images that do not indicate the presence of any of the aforementioned pathologies. At the same time, it does not require programming skills or technical knowledge of deep learning. These are key features of the application, as it has been designed for implementation in a medical facility, where it could be used to assist doctors in diagnosing brain tumors.

Another advantage of the system is its easy accessibility, as the application does not need to be installed on the user's device. Access is provided via a web browser on a computer connected to an authorized network. This significantly streamlines the onboarding process for new users. The installation, deployment, and potential migration of the application are also simplified through the use of containerization technology.

To facilitate access to analyzed images, BrainScanner stores them in the file system and associates them with patient data. Additionally, it allows doctors to share knowledge by labeling images that have been confirmed to contain one of the diagnosed classes. Classified images can later be used to train a new model.

Each time the algorithm is used, the system saves the obtained predictions to a database. The stored data can later be used to assess the model’s classification capabilities in a real medical environment.
