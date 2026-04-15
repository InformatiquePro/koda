import { Flex, Text } from '@radix-ui/themes';
import StatRow from './StatRow';
import { Task } from '../../types/koda';

interface Props {
    tasks: Task[];
}

export default function StatsPanel({ tasks }: Props) {
    const stats = {
        todo:       tasks.filter((t) => t.column === 'TODO').length,
        inProgress: tasks.filter((t) => t.column === 'IN_PROGRESS').length,
        blocked:    tasks.filter((t) => t.column === 'BLOCKED').length,
        done:       tasks.filter((t) => t.column === 'DONE').length,
    };

    return (
        <>
        <Text size="1" color="gray" weight="bold" mb="2">PRODUCTIVITÉ</Text>
        <Flex direction="column" gap="1" mb="4">
        <StatRow label="À faire"  value={stats.todo}       color="var(--col-todo)" />
        <StatRow label="En cours" value={stats.inProgress} color="var(--col-inprogress)" />
        <StatRow label="Bloqué"   value={stats.blocked}    color="var(--col-blocked)" />
        <StatRow label="Fini"     value={stats.done}       color="var(--col-done)" />
        </Flex>
        </>
    );
}
