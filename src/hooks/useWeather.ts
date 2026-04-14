// src/hooks/useWeather.ts

import { useState, useEffect } from 'react';

interface WeatherData {
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    city: string;
}

export function useWeather(apiKey?: string, cityId?: string) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!apiKey || !cityId) return;

        async function fetchWeather() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${apiKey}&units=metric&lang=fr`
                );
                if (!res.ok) throw new Error(`Erreur ${res.status} — clé ou ID invalide`);
                const data = await res.json();
                setWeather({
                    temp: Math.round(data.main.temp),
                           feels_like: Math.round(data.main.feels_like),
                           description: data.weather[0].description,
                           icon: data.weather[0].icon,
                           humidity: data.main.humidity,
                           city: data.name,
                });
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();
        // Rafraîchit toutes les 10 minutes
        const interval = setInterval(fetchWeather, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [apiKey, cityId]);

    return { weather, error, loading };
}
