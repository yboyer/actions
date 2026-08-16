# ci-templates

Référentiel de templates de workflows GitHub Actions réutilisables.

## Workflows disponibles

### Trivy — analyse de sécurité

Le workflow [`trivy.yml`](.github/workflows/trivy.yml) utilise [Trivy](https://github.com/aquasecurity/trivy) pour scanner les vulnérabilités de sécurité dans un dépôt ou une image Docker. Il publie les résultats dans l'onglet **Security** de GitHub via le format SARIF.

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

#### Paramètres disponibles

| Paramètre      | Description                                                      | Valeur par défaut      |
| -------------- | ---------------------------------------------------------------- | ---------------------- |
| `scan-type`    | Type de scan : `fs` (filesystem) ou `image` (conteneur Docker)  | `fs`                   |
| `image-ref`    | Référence de l'image Docker à scanner (requis si `image`)        | `""`                   |
| `severity`     | Niveaux de sévérité à reporter                                   | `CRITICAL,HIGH`        |
| `exit-code`    | Code de sortie si des vulnérabilités sont trouvées (0 ou 1)      | `1`                    |
| `format`       | Format de sortie : `table`, `json` ou `sarif`                    | `sarif`                |
| `output`       | Fichier de sortie pour le rapport SARIF                          | `trivy-results.sarif`  |
| `upload-sarif` | Upload du rapport SARIF dans l'onglet Security de GitHub         | `true`                 |

#### Exemple — scan d'image Docker

```yaml
jobs:
  trivy:
    uses: yboyer/ci-templates/.github/workflows/trivy.yml@main
    with:
      scan-type: image
      image-ref: myimage:latest
      severity: CRITICAL,HIGH,MEDIUM
```