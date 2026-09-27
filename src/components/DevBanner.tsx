// src/components/DevBanner.tsx

import { useEffect, useState } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { invoke } from '@tauri-apps/api/core';

export default function DevBanner() {
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        invoke<boolean>('is_dev_mode')
        .then((val) => setIsDev(val))
        .catch(() => setIsDev(false));
    }, []);

    if (!isDev) return null;

    return (
        <Flex
        align="center"
        justify="center"
        px="4"
        py="1"
        style={{
            background: 'repeating-linear-gradient(45deg, #854d0e 0px, #854d0e 10px, #713f12 10px, #713f12 20px)',
            borderBottom: '1px solid #a16207',
            flexShrink: 0,
            zIndex: 1000,
        }}
        >
        <Text size="1" weight="bold" style={{ color: '#fef08a', letterSpacing: '0.05em' }}>
        ⚠️ KODA LANCÉ EN MODE DEV — À UTILISER UNIQUEMENT POUR LE DÉVELOPPEMENT ET LE DÉBOGAGE
        </Text>
        </Flex>
    );
}
