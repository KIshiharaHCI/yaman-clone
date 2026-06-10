/**
 * Shared Cookie Consent Configuration
 * This ensures a single source of truth across all pages.
 */
(function() {
    const config = {
        background: {
            showBackground: false,
        },
        cookieIcon: {
            position: "bottomLeft",
        },
        cookieTypes: [
            {
                id: "technisch_notwendig",
                name: "Technisch notwendig",
                description: "Diese Cookies sind für den Betrieb der Seite und die Speicherung Ihrer Auswahl erforderlich und können nicht deaktiviert werden.",
                required: true,
                onAccept: function () {
                    console.log("Technically necessary cookies accepted");
                },
            },
            {
                id: "interaktive_karten",
                name: "Interaktive Karten",
                description: "Wir nutzen Google Maps, um Ihnen unseren Standort im Autocenter anzuzeigen. Ohne Zustimmung bleibt die Karte ausgeblendet.",
                required: false,
                onAccept: function () {
                    const showMap = () => {
                        const map = document.getElementById("google-map");
                        const overlay = document.getElementById("map-overlay");
                        if (map && overlay) {
                            const dataSrc = map.getAttribute("data-src");
                            if (dataSrc) map.src = dataSrc;
                            map.style.display = "block";
                            overlay.style.display = "none";
                        }
                    };
                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", showMap, { once: true });
                    } else {
                        showMap();
                    }
                },
                onReject: function () {
                    const hideMap = () => {
                        const map = document.getElementById("google-map");
                        const overlay = document.getElementById("map-overlay");
                        if (map && overlay) {
                            map.removeAttribute("src");
                            map.style.display = "block";
                            overlay.style.display = "flex";
                        }
                    };
                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", hideMap, { once: true });
                    } else {
                        hideMap();
                    }
                },
            },
            {
                id: "video_inhalte",
                name: "Video-Inhalte",
                description: "Wir binden YouTube-Inhalte ein, um Ihnen unsere Fahrzeuge und Events zu präsentieren. Ohne Zustimmung bleiben diese Inhalte ausgeblendet.",
                required: false,
                onAccept: function () {
                    const revealVideos = () => {
                        // 1. Single Video (serie-zwei.html)
                        const iframes = document.querySelectorAll('.video-container iframe[data-src]');
                        const videoPlaceholders = document.querySelectorAll('.video-placeholder');
                        
                        iframes.forEach(iframe => {
                            const src = iframe.getAttribute('data-src');
                            if (src) iframe.src = src;
                            iframe.style.display = 'block';
                        });
                        
                        videoPlaceholders.forEach(p => p.style.display = 'none');

                        // 2. Playlist Theater (serie-eins.html) & Single Theater (serie-zwei.html) classes
                        const theaters = document.querySelectorAll('.playlist-theater, .single-video-theater');
                        theaters.forEach(t => {
                            t.classList.remove('consent-blocked');
                            t.classList.add('consent-given');
                        });

                        if (typeof window.renderSeriesTheater === 'function' && window.serieEinsVideos) {
                            window.renderSeriesTheater(window.serieEinsVideos, true);
                        }
                        
                        // Push to dataLayer if available
                        if (typeof dataLayer !== 'undefined') {
                            dataLayer.push({ event: "consent_accepted_video_inhalte" });
                        }
                    };

                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", revealVideos, { once: true });
                    } else {
                        revealVideos();
                    }
                },
                onReject: function () {
                    const blockVideos = () => {
                        // Reset iframes in serie-zwei
                        const iframes = document.querySelectorAll('.video-container iframe[data-src]');
                        const videoPlaceholders = document.querySelectorAll('.video-placeholder');
                        
                        iframes.forEach(iframe => {
                            iframe.removeAttribute('src');
                            iframe.style.display = 'none';
                        });
                        
                        videoPlaceholders.forEach(p => p.style.display = 'flex');

                        // Reset theater classes
                        const theaters = document.querySelectorAll('.playlist-theater, .single-video-theater');
                        theaters.forEach(t => {
                            t.classList.add('consent-blocked');
                            t.classList.remove('consent-given');
                        });

                        // In serie-eins, the re-render with no consent will show the placeholder
                        if (typeof window.renderSeriesTheater === 'function' && window.serieEinsVideos) {
                            window.renderSeriesTheater(window.serieEinsVideos);
                        }
                    };

                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", blockVideos, { once: true });
                    } else {
                        blockVideos();
                    }
                },
            },
        ],
        text: {
            banner: {
                description: 'Wir nutzen Cookies und externe Dienste (Google Maps &amp; YouTube), um Ihr Nutzererlebnis zu verbessern und unsere Fahrzeugpräsentationen anzuzeigen. <a href="datenschutz.html">Datenschutzerklärung</a>.',
                acceptAllButtonText: "Alle akzeptieren",
                acceptAllButtonAccessibleLabel: "Alle Cookies und externen Dienste akzeptieren",
                rejectNonEssentialButtonText: "Nur notwendige",
                rejectNonEssentialButtonAccessibleLabel: "Nur technisch notwendige Cookies zulassen",
                preferencesButtonText: "Einstellungen",
                preferencesButtonAccessibleLabel: "Individuelle Datenschutzeinstellungen verwalten",
            },
            preferences: {
                title: "Cookie-Einstellungen anpassen",
                description: "<p>Wir respektieren Ihr Recht auf Privatsphäre. Sie können entscheiden, welche Arten von Cookies und externen Diensten Sie zulassen möchten. Ihre Auswahl gilt für unsere gesamte Website.</p>",
            },
        },
        position: {
            banner: "bottomLeft",
        },
    };

    // Initialize the manager with the config
    if (window.silktideCookieBannerManager) {
        window.silktideCookieBannerManager.updateCookieBannerConfig(config);
    } else {
        // Fallback in case the manager script hasn't loaded yet
        document.addEventListener('DOMContentLoaded', () => {
            if (window.silktideCookieBannerManager) {
                window.silktideCookieBannerManager.updateCookieBannerConfig(config);
            }
        });
    }
})();
