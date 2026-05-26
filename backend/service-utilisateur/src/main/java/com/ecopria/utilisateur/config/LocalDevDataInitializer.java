package com.ecopria.utilisateur.config;

import com.ecopria.utilisateur.model.Association;
import com.ecopria.utilisateur.model.Citizen;
import com.ecopria.utilisateur.repository.AssociationRepository;
import com.ecopria.utilisateur.repository.CitizenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Données minimales en dev local si la base est vide (profil {@code local}).
 */
@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class LocalDevDataInitializer implements ApplicationRunner {

    private final AssociationRepository associationRepository;
    private final CitizenRepository citizenRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedAssociation();
        seedCitizen();
    }

    private void seedAssociation() {
        if (associationRepository.findByAuthId(1L).isPresent()) {
            return;
        }
        Association a = new Association();
        a.setAuthId(1L);
        a.setName("Méditerranée Propre");
        a.setEmail("contact@mediterranee-propre.fr");
        a.setPhone("0612345678");
        a.setAddress("12 quai du Port");
        a.setCity("Marseille");
        a.setDescription("Association de protection de l'environnement en Méditerranée.");
        associationRepository.save(a);
        log.info("[dev] Association authId=1 créée dans db_utilisateur");
    }

    private void seedCitizen() {
        if (citizenRepository.findByAuthId(2L).isPresent()) {
            return;
        }
        Citizen c = new Citizen();
        c.setAuthId(2L);
        c.setFirstName("Marie");
        c.setLastName("Martin");
        c.setEmail("marie.martin@example.com");
        c.setPhone("0698765432");
        c.setCity("Marseille");
        c.setTotalPoints(120);
        citizenRepository.save(c);
        log.info("[dev] Citoyen authId=2 créé dans db_utilisateur");
    }
}
