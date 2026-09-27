// src/components/KioskMode.tsx

import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { useWeather } from '../hooks/useWeather';
import KanbanBoard from './KanbanBoard';

export default function KioskMode() {
    const [showBoard, setShowBoard] = useState(false);
    const [time, setTime] = useState(new Date());
    const { settings, updateSettings } = useAppStore();

    const { weather, error, loading } = useWeather(
        settings.weatherApiKey,
        settings.weatherCityId
    );

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const brightness = settings.lowBrightnessKiosk ? 0.6 : 1;

    if (showBoard) {
        return (
            <Box style={{ filter: `brightness(${brightness})`, height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Barre du haut fixe — ne se superpose pas au contenu */}
            <Flex
            align="center"
            justify="between"
            px="4"
            py="2"
            style={{
                flexShrink: 0,
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(15, 12, 41, 0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 100,
            }}
            >
            <Button
            variant="ghost"
            size="2"
            onClick={() => setShowBoard(false)}
            >
            ← Station
            </Button>

            <Text size="2" style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>

            {/* Bouton quitter le mode Kiosk */}
            <Button
            variant="soft"
            color="red"
            size="2"
            onClick={() => updateSettings({ kioskMode: false })}
            >
            ✕ Quitter Kiosk
            </Button>
            </Flex>

            {/* Board prend le reste de l'espace */}
            <Box style={{ flex: 1, overflow: 'hidden' }}>
            <KanbanBoard />
            </Box>

            </Box>
        );
    }

    // Écran station (heure + météo)
    return (
        <Box
        className="kiosk-mode"
        style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            filter: `brightness(${brightness})`,
            background: 'radial-gradient(ellipse at center, #1a1a2e, #0f0f1a)',
            gap: '8px',
            position: 'relative',
        }}
        >
        {/* Bouton quitter Kiosk — coin haut droit */}
        <Button
        variant="soft"
        color="red"
        size="1"
        onClick={() => updateSettings({ kioskMode: false })}
        style={{
            position: 'absolute',
            top: 16,
            right: 16,
            opacity: 0.6,
        }}
        >
        ✕ Quitter Kiosk
        </Button>

        {/* Heure */}
        <Text
        size="9"
        weight="bold"
        style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px' }}
        >
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {/* Date */}
        <Text size="4" color="gray">
        {time.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
        })}
        </Text>

        {/* Widget météo */}
        <Box
        mt="4"
        style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '16px 28px',
            minWidth: 260,
            textAlign: 'center',
        }}
        >
        {loading && <Text size="2" color="gray">Chargement météo...</Text>}

        {error && (
            <Flex direction="column" gap="1" align="center">
            <Text size="2" color="red">⚠️ {error}</Text>
            <Text size="1" color="gray">Vérifie ta clé API et l'ID ville dans les paramètres</Text>
            </Flex>
        )}

        {!loading && !error && !weather && (
            <Text size="2" color="gray">
            {!settings.weatherApiKey || !settings.weatherCityId
                ? '⚙️ Configure la météo dans les paramètres'
        : 'Aucune donnée'}
        </Text>
        )}

        {weather && (
            <Flex direction="column" align="center" gap="1">
            <Flex align="center" gap="2">
            <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            style={{ width: 52, height: 52 }}
            />
            <Text size="8" weight="bold">{weather.temp}°C</Text>
            </Flex>
            <Text size="3" style={{ textTransform: 'capitalize' }}>{weather.description}</Text>
            <Text size="2" color="gray">📍 {weather.city}</Text>
            <Flex gap="3" mt="1">
            <Text size="1" color="gray">Ressenti {weather.feels_like}°C</Text>
            <Text size="1" color="gray">Humidité {weather.humidity}%</Text>
            </Flex>
            </Flex>
        )}
        </Box>

        {/* Bouton voir les tâches */}
        <Button
        size="4"
        variant="soft"
        mt="6"
        style={{ minWidth: 220, minHeight: 56, fontSize: '1.1rem', cursor: 'pointer' }}
        onClick={() => setShowBoard(true)}
        >
        📋 Voir les tâches
        </Button>

        </Box>
    );
}
