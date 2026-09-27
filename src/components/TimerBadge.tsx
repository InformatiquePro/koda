// src/components/TimerBadge.tsx

import { Flex, Text } from '@radix-ui/themes';
import { useTimer } from '../hooks/useTimer';

interface Props {
    startedAt: string;
    durationSeconds: number;
}

export default function TimerBadge({ startedAt, durationSeconds }: Props) {
    const { formatted, isExpired } = useTimer(startedAt, durationSeconds);

    return (
        <Flex
        align="center"
        gap="1"
        px="2"
        py="1"
        style={{
            borderRadius: 8,
            background: isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.15)',
            border: `1px solid ${isExpired ? 'rgba(239,68,68,0.5)' : 'rgba(251,191,36,0.3)'}`,
            animation: isExpired ? 'pulse-red 1s infinite' : undefined,
        }}
        >
        <Text size="1" style={{ color: isExpired ? '#ef4444' : '#fbbf24' }}>
        {isExpired ? '🔴 Temps dépassé !' : `⏱ ${formatted}`}
        </Text>
        </Flex>
    );
}
