# ci-templates

Référentiel de templates de workflows GitHub Actions réutilisables.

## Workflows disponibles

### Trivy — analyse de sécurité

Le workflow [`trivy.yml`](.github/workflows/trivy.yml) utilise [Trivy](https://github.com/aquasecurity/trivy) pour scanner les vulnérabilités de sécurité (`CRITICAL`, `HIGH`) dans le code source du dépôt. Il publie les résultats dans l'onglet **Security** de GitHub via le format SARIF.

#### Utilisation

Créez un fichier `.github/workflows/security.yml` dans votre dépôt :

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1" # Tous les lundis à 06h00

jobs:
  trivy:
    uses: yboyer/ci-templates/.github/workflows/trivy.yml@main
```