FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Build context is campwatch/ so paths are relative to that
COPY CampWatch.Infrastructure/CampWatch.Infrastructure.csproj CampWatch.Infrastructure/
RUN dotnet restore CampWatch.Infrastructure/CampWatch.Infrastructure.csproj

COPY CampWatch.Infrastructure/ CampWatch.Infrastructure/

COPY CampWatch.Api/CampWatch.Api.csproj CampWatch.Api/
RUN dotnet restore CampWatch.Api/CampWatch.Api.csproj

COPY CampWatch.Api/ CampWatch.Api/
RUN dotnet publish CampWatch.Api/CampWatch.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CampWatch.Api.dll"]
