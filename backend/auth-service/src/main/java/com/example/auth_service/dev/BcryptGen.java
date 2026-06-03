package com.example.auth_service.dev;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Run once: mvn -q exec:java "-Dexec.mainClass=com.example.auth_service.dev.BcryptGen" */
public class BcryptGen {
  public static void main(String[] args) {
    System.out.println(new BCryptPasswordEncoder().encode("Admin123!"));
  }
}
