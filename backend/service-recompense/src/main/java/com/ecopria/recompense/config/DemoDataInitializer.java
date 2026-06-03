package com.ecopria.recompense.config;

import com.ecopria.recompense.model.*;
import com.ecopria.recompense.model.Recompense.RecompenseType;
import com.ecopria.recompense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataInitializer implements ApplicationRunner {

    private final PartenaireRepository partenaireRepository;
    private final RecompenseRepository recompenseRepository;
    private final AvisPartenaireRepository avisPartenaireRepository;
    private final CouponRepository couponRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Partenaire p = partenaireRepository.findByUserId(1L).orElse(null);
        if (p == null) {
            p = Partenaire.builder()
                    .userId(1L)
                    .name("Café Botanique")
                    .category("Restauration")
                    .address("12 rue des Jardins")
                    .city("Tétouan")
                    .description("Un café éco-responsable au cœur de Tétouan. Engagé pour une consommation locale, bio et zéro-déchet.")
                    .imageUrl("https://images.unsplash.com/photo-1515823064-24b604696a43?w=800")
                    .galleryImages(String.join("||",
                            "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200",
                            "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200",
                            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200"))
                    .phone("+212 612-345678")
                    .website("https://cafebotanique.example.com")
                    .instagramUrl("https://instagram.com/cafebotanique")
                    .facebookUrl("https://facebook.com/cafebotanique")
                    .openingHours("Lun-Dim 08:00-22:30")
                    .vuesProfil(1842L)
                    .clicsOffres(624L)
                    .commissionRate(15.0)
                    .build();
            p = partenaireRepository.save(p);
            log.info("Partenaire démo Café Botanique créé (userId=1)");
        } else {
            if (p.getVuesProfil() == null || p.getVuesProfil() == 0) {
                p.setVuesProfil(1842L);
                p.setClicsOffres(624L);
            }
            if (p.getAddress() == null) {
                p.setAddress("12 rue des Jardins");
                p.setCity("Tétouan");
                p.setDescription("Un café éco-responsable au cœur de Tétouan. Engagé pour une consommation locale, bio et zéro-déchet.");
                p.setImageUrl("https://images.unsplash.com/photo-1515823064-24b604696a43?w=800");
                partenaireRepository.save(p);
            }
            if (p.getGalleryImages() == null || p.getGalleryImages().isBlank()) {
                p.setGalleryImages(String.join("||",
                        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200",
                        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200",
                        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200"));
            }
            if (p.getPhone() == null) p.setPhone("+212 612-345678");
            if (p.getWebsite() == null) p.setWebsite("https://cafebotanique.example.com");
            if (p.getInstagramUrl() == null) p.setInstagramUrl("https://instagram.com/cafebotanique");
            if (p.getFacebookUrl() == null) p.setFacebookUrl("https://facebook.com/cafebotanique");
            if (p.getOpeningHours() == null) p.setOpeningHours("Lun-Dim 08:00-22:30");
            partenaireRepository.save(p);
        }

        if (recompenseRepository.findByPartenaireId(p.getId()).isEmpty()) {
            seedOffres(p);
        }
        if (avisPartenaireRepository.countByPartenaireId(p.getId()) == 0) {
            seedAvis(p);
        }
    }

    private void seedOffres(Partenaire p) {
        Recompense cafe = Recompense.builder()
                .partenaire(p)
                .title("Café & pâtisserie maison")
                .description("Un café ou une pâtisserie au choix")
                .imageUrl("https://images.unsplash.com/photo-1515823064-24b604696a43?w=400")
                .pointsNecessaires(150)
                .type(RecompenseType.STOCK)
                .stock(42)
                .valeurDh(35.0)
                .isActive(true)
                .build();

        Recompense tote = Recompense.builder()
                .partenaire(p)
                .title("Tote bag en coton bio")
                .description("Sac réutilisable Ecopria")
                .imageUrl("https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400")
                .pointsNecessaires(200)
                .type(RecompenseType.STOCK)
                .stock(18)
                .valeurDh(80.0)
                .isActive(true)
                .build();

        Recompense miel = Recompense.builder()
                .partenaire(p)
                .title("Pot de miel artisanal 250g")
                .description("Miel local des Rif")
                .imageUrl("https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400")
                .pointsNecessaires(120)
                .type(RecompenseType.STOCK)
                .stock(25)
                .valeurDh(45.0)
                .hasMystereBox(true)
                .mystereBoxPoints(80)
                .isActive(true)
                .build();

        recompenseRepository.save(cafe);
        recompenseRepository.save(tote);
        miel = recompenseRepository.save(miel);

        MystereBoxItem i1 = MystereBoxItem.builder()
                .recompense(miel)
                .titre("Miel premium 500g")
                .description("Pot grand format")
                .probabilite(20)
                .build();
        MystereBoxItem i2 = MystereBoxItem.builder()
                .recompense(miel)
                .titre("Miel classique 250g")
                .description("Pot standard")
                .probabilite(50)
                .build();
        MystereBoxItem i3 = MystereBoxItem.builder()
                .recompense(miel)
                .titre("Cuillère en bois offerte")
                .description("Accessoire")
                .probabilite(30)
                .build();
        miel.getMystereBoxItems().addAll(List.of(i1, i2, i3));
        recompenseRepository.save(miel);
        log.info("Offres démo créées pour {}", p.getName());
    }

    private void seedAvis(Partenaire p) {
        avisPartenaireRepository.save(AvisPartenaire.builder()
                .partenaire(p).authorName("Yasmine K.").rating(5)
                .comment("Excellent accueil et produits locaux de qualité.")
                .build());
        avisPartenaireRepository.save(AvisPartenaire.builder()
                .partenaire(p).authorName("Omar B.").rating(4)
                .comment("Très bon café, un peu d'attente le week-end.")
                .build());
        avisPartenaireRepository.save(AvisPartenaire.builder()
                .partenaire(p).authorName("Lina M.").rating(5)
                .comment("Engagement écologique visible, je recommande.")
                .build());
    }
}
