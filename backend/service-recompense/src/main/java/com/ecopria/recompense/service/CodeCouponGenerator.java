package com.ecopria.recompense.service;

import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class CodeCouponGenerator {

    public String generate() {
        // format : ECO-2026-XXXXX
        String year = String.valueOf(java.time.Year.now().getValue());
        String random = UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 5)
                .toUpperCase();
        return "ECO-" + year + "-" + random;
    }
}