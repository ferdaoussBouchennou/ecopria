package com.ecopria.utilisateur.mapper;

import com.ecopria.utilisateur.dto.*;
import com.ecopria.utilisateur.model.*;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public Citizen toEntity(CitizenDTO dto) {
        if (dto == null) return null;
        Citizen citizen = new Citizen();
        citizen.setAuthId(dto.getAuthId());
        citizen.setFirstName(dto.getFirstName());
        citizen.setLastName(dto.getLastName());
        citizen.setPhone(dto.getPhone());
        citizen.setAddress(dto.getAddress());
        citizen.setEmail(dto.getEmail());
        citizen.setCity(dto.getCity());
        citizen.setPhoto(dto.getPhoto());
        return citizen;
    }

    public Association toEntity(AssociationDTO dto) {
        if (dto == null) return null;
        Association association = new Association();
        association.setAuthId(dto.getAuthId());
        association.setName(dto.getName());
        association.setEmail(dto.getEmail());
        association.setPhone(dto.getPhone());
        association.setAddress(dto.getAddress());
        association.setDescription(dto.getDescription());
        association.setLogo(dto.getLogo());
        association.setCity(dto.getCity());
        return association;
    }

    public Partner toEntity(PartnerDTO dto) {
        if (dto == null) return null;
        Partner partner = new Partner();
        partner.setAuthId(dto.getAuthId());
        partner.setName(dto.getName());
        partner.setEmail(dto.getEmail());
        partner.setPhone(dto.getPhone());
        partner.setAddress(dto.getAddress());
        partner.setDescription(dto.getDescription());
        partner.setCategory(dto.getCategory());
        partner.setCity(dto.getCity());
        partner.setLogo(dto.getLogo());
        return partner;
    }
}
