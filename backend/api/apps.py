from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    network = None
    
    def ready(self):
        from .utils import load_network
        try:
            print("Ładowanie modelu sieci neuronowej...")
            self.network = load_network()
            print("Model załadowany!")
        except Exception as e:
            print(f"Błąd podczas ładowania modelu: {e}")
