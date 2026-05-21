# ── ÉTAPE 1 : image minimale JRE (pas JDK complet) ────────────
FROM eclipse-temurin:21-jre

# ── ÉTAPE 2 : dossier de travail ───────────────────────────────
WORKDIR /app

# ── ÉTAPE 3 : créer un utilisateur non-root ────────────────────
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# ── ÉTAPE 4 : copier le JAR ────────────────────────────────────
COPY target/*.jar app.jar

# ── ÉTAPE 5 : donner les droits à l'utilisateur ────────────────
RUN chown appuser:appgroup app.jar

# ── ÉTAPE 6 : basculer sur l'utilisateur non-root ──────────────
USER appuser

# ── ÉTAPE 7 : port ─────────────────────────────────────────────
EXPOSE 8084

# ── ÉTAPE 8 : lancer avec des limites mémoire JVM ──────────────
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]