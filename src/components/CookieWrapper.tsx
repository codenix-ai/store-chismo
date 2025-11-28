"use client";
import { useState, useEffect } from "react";
import CookieConsentModal from "./CookieConsentModal";

export default function CookieWrapper() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setShow(false);
  };

  return show ? <CookieConsentModal onAccept={handleAccept} /> : null;
}
