#!/usr/bin/env bash

ORG_NAME="lyoss-usm"
REPO_JSON_FIELDS="createdAt,description,forkCount,issues,languages,latestRelease,licenseInfo,name,pullRequests,repositoryTopics,stargazerCount,updatedAt,url,openGraphImageUrl"
REPO_LIMIT=100
REPO_VISIBILITY="public"
REPO_FLAGS="--limit ${REPO_LIMIT} --visibility ${REPO_VISIBILITY} --source"
EXCLUDED_REPOS='[".github", "template", "discussions", "docs", "workflows"]'
OUT_FOLDER='data/'

mkdir -p "$OUT_FOLDER"

echo "=== Iniciando Scrapping de $ORG_NAME ==="

echo "[1/2] Scrapping repos..."
gh repo list ${ORG_NAME} ${REPO_FLAGS} --json ${REPO_JSON_FIELDS} 2>/dev/null | \
  jq --argjson excl "$EXCLUDED_REPOS" 'map(select(.name as $n | $excl | index($n) | not))' > "${OUT_FOLDER}repos.json"

echo "[2/2] Scrapping contributors and contributions..."

echo '{"repos": {}}' > "${OUT_FOLDER}contributions.json"
> "${OUT_FOLDER}raw_contributors.tmp"

REPOS_TO_SCAN=$(gh repo list ${ORG_NAME} ${REPO_FLAGS} --json name 2>/dev/null | \
  jq -r --argjson excl "$EXCLUDED_REPOS" 'map(select(.name as $n | $excl | index($n) | not)) | .[].name')

for repo in $REPOS_TO_SCAN; do
  echo "  -> Extrayendo datos de: $repo"

  # Descargamos TODOS los datos del contribuidor en este repo
  RAW_DATA=$(gh api repos/${ORG_NAME}/${repo}/contributors --paginate 2>/dev/null || echo "[]")

  # Guardamos los datos crudos acumulándolos en el archivo temporal en el OUT_FOLDER
  echo "$RAW_DATA" >> "${OUT_FOLDER}raw_contributors.tmp"

  # Filtramos solo el mapa {"login": contribuciones} para inyectarlo en contributions.json
  REPO_MAP=$(echo "$RAW_DATA" | jq 'map({(.login): .contributions}) | add')

  if [ "$REPO_MAP" == "null" ] || [ -z "$REPO_MAP" ]; then
    REPO_MAP="{}"
  fi

  # Actualizamos el archivo temporal dentro del directorio
  jq --arg repo "$repo" --argjson rc "$REPO_MAP" '.repos[$repo] = $rc' "${OUT_FOLDER}contributions.json" > "${OUT_FOLDER}tmp.json" && mv "${OUT_FOLDER}tmp.json" "${OUT_FOLDER}contributions.json"
done

echo "  -> Generando contributors.json (Perfiles y sumatoria total)..."
# Magia de Agregación de JQ:
# 1. -s (slurp): Lee todas las líneas del archivo temporal como un gran arreglo.
# 2. flatten: Aplana los arreglos anidados (repo1, repo2) en una sola lista de usuarios.
# 3. group_by: Agrupa los objetos por el nombre de usuario (.login).
# 4. map: Toma cada grupo, extrae los datos visuales (del primer elemento [0]) y SUMA las contribuciones.
# 5. sort_by: Ordena el arreglo final de mayor a menor contribución.
jq -s 'flatten | group_by(.login) | map({
  login: .[0].login,
  html_url: .[0].html_url,
  avatar_url: .[0].avatar_url,
  contributions: (map(.contributions) | add)
}) | sort_by(-.contributions)' "${OUT_FOLDER}raw_contributors.tmp" > "${OUT_FOLDER}contributors.json"

echo "  -> Generando bloque 'total' en contributions.json..."
jq '.total = ([.repos[] | to_entries[]] | reduce .[] as $item ({}; .[$item.key] += $item.value))' "${OUT_FOLDER}contributions.json" > "${OUT_FOLDER}tmp.json" && mv "${OUT_FOLDER}tmp.json" "${OUT_FOLDER}contributions.json"

# Limpiamos los archivos temporales de la carpeta
rm "${OUT_FOLDER}raw_contributors.tmp"

echo "=== Proceso Finalizado con Éxito ==="
