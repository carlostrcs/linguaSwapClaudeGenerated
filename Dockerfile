# Multi-stage build for the LinguaSwap API.
# Build context is the REPO ROOT (the csproj restore needs both projects).
#   docker build -t linguaswap-api .
#   docker run -p 8080:8080 -e ConnectionStrings__Default="..." -e Jwt__Key="..." linguaswap-api

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy just the project file first so `restore` is cached until dependencies actually change.
COPY backend/LinguaSwap.Api/LinguaSwap.Api.csproj backend/LinguaSwap.Api/
RUN dotnet restore backend/LinguaSwap.Api/LinguaSwap.Api.csproj

COPY . .
RUN dotnet publish backend/LinguaSwap.Api/LinguaSwap.Api.csproj \
    -c Release -o /app/publish --no-restore

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render (and most container hosts) inject the port to listen on via $PORT; default to 8080 locally.
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080

# Disable config-file hot-reload. By default WebApplication.CreateBuilder loads appsettings*.json
# with reloadOnChange:true, which opens an inotify file watcher per file. Render's containers have a
# low, shared inotify instance limit (128), so watcher creation throws at startup:
#   "The configured user limit (128) on the number of inotify instances has been reached"
# and the process exits 139 before any of our code runs. Config comes from env vars here and never
# changes at runtime, so watching the files buys nothing — turn it off.
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

EXPOSE 8080

# `exec` matters: it makes dotnet PID 1 so the host's SIGTERM reaches ASP.NET, which then drains
# in-flight requests instead of being killed mid-response on deploy/restart. $PORT is expanded by
# the shell at runtime (Render injects it); 8080 is the local default.
CMD ["/bin/sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet LinguaSwap.Api.dll"]
