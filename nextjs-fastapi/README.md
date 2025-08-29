To actually run:


debug with psql: psql "postgresql://appuser:devpassword@localhost:5435/appdb"


1. create docker (only first time)
docker run --name pg16 \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=appdb \
  -p 5435:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:16

2. to stop docker
docker stop pg16

3. to start docker
docker start pg16