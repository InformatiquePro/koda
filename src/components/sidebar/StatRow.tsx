import { Box, Flex, Text } from '@radix-ui/themes';

interface Props {
    label: string;
    value: number;
    color: string;
}

export default function StatRow({ label, value, color }: Props) {
    return (
        <Flex
        align="center"
        justify="between"
        style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--glass-bg)' }}
        >
        <Flex align="center" gap="2">
        <Box style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <Text size="1">{label}</Text>
        </Flex>
        <Text size="1" weight="bold">{value}</Text>
        </Flex>
    );
}
