import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Table,
  Badge,
  LoadingOverlay,
  Box,
  ThemeIcon,
  SimpleGrid,
  Divider,
  Button,
  Modal,
  Alert,
} from '@mantine/core';
import {
  IconPackage,
  IconInfoCircle,
  IconBox,
  IconCash,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface StockGlobal {
  id: number;
  designation: string;
  unite: string;
  total_entrees: number;
  total_sorties: number;
  stock: number;
  cout_moyen: number;
  valeur_stock: number;
}

const StockGlobalPage: React.FC = () => {
  const [data, setData] = useState<StockGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const charger = async () => {
    setLoading(true);
    const db = await getDb();

    const res = await db.select<StockGlobal[]>(`
      SELECT 
        m.id,
        m.designation,
        m.unite,
        COALESCE(SUM(e.quantite), 0) AS total_entrees,
        COALESCE(SUM(s.quantite), 0) AS total_sorties,
        COALESCE(SUM(e.quantite), 0) - COALESCE(SUM(s.quantite), 0) AS stock,
        CASE 
          WHEN SUM(e.quantite) > 0 
          THEN SUM(e.quantite * e.cout_unitaire) / SUM(e.quantite)
          ELSE 0
        END AS cout_moyen,
        (
          COALESCE(SUM(e.quantite), 0) - COALESCE(SUM(s.quantite), 0)
        ) *
        (
          CASE 
            WHEN SUM(e.quantite) > 0 
            THEN SUM(e.quantite * e.cout_unitaire) / SUM(e.quantite)
            ELSE 0
          END
        ) AS valeur_stock
      FROM matieres m
      LEFT JOIN entrees_stock e ON e.matiere_id = m.id
      LEFT JOIN sorties_stock s ON s.matiere_id = m.id
      WHERE m.est_supprime = 0
      GROUP BY m.id
      ORDER BY m.designation
    `);

    setData(res || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const totalGeneral = data.reduce((s, m) => s + m.valeur_stock, 0);
  const totalEntrees = data.reduce((s, m) => s + m.total_entrees, 0);
  const totalSorties = data.reduce((s, m) => s + m.total_sorties, 0);
  const articlesEnRupture = data.filter(m => m.stock <= 0).length;
  const articlesAlerte = data.filter(m => m.stock > 0 && m.stock <= 5).length;

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement du stock global...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconPackage size={24} color="white" />
                <Title order={2} c="white">Stock global</Title>
              </Group>
              <Text size="sm" c="gray.3">
                État des stocks de matières premières
              </Text>
            </Stack>
            <Group gap="md">
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Instructions
              </Button>
              <ThemeIcon size={48} radius="md" color="white" variant="light">
                <IconPackage size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Valeur totale
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconCash size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalGeneral.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total entrées
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconPackage size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalEntrees.toLocaleString()}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total sorties
              </Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconBox size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {totalSorties.toLocaleString()}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Ruptures
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconAlertCircle size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {articlesEnRupture}
            </Text>
          </Card>
        </SimpleGrid>

        {/* ALERTES STOCK */}
        {(articlesEnRupture > 0 || articlesAlerte > 0) && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="yellow"
            variant="light"
            title="Attention stock"
          >
            <Group gap="md">
              {articlesEnRupture > 0 && (
                <Text size="sm">
                  ⚠️ {articlesEnRupture} article{articlesEnRupture > 1 ? 's' : ''} en rupture de stock
                </Text>
              )}
              {articlesAlerte > 0 && (
                <Text size="sm">
                  📦 {articlesAlerte} article{articlesAlerte > 1 ? 's' : ''} avec stock bas
                </Text>
              )}
            </Group>
          </Alert>
        )}

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white' }}>Matière</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Entrées</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Sorties</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Stock</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Coût moyen</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((m) => {
                const isLow = m.stock <= 0;
                const isAlert = m.stock > 0 && m.stock <= 5;
                return (
                  <Table.Tr key={m.id}>
                    <Table.Td fw={500}>{m.designation}</Table.Td>
                    <Table.Td ta="right">
                      {m.total_entrees.toLocaleString()} {m.unite}
                    </Table.Td>
                    <Table.Td ta="right">
                      {m.total_sorties.toLocaleString()} {m.unite}
                    </Table.Td>
                    <Table.Td ta="right">
                      <Badge
                        color={isLow ? 'red' : (isAlert ? 'orange' : 'green')}
                        variant="light"
                        size="sm"
                      >
                        {m.stock.toLocaleString()} {m.unite}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      {m.cout_moyen.toFixed(2)} FCFA
                    </Table.Td>
                    <Table.Td ta="right" fw={600} c="blue">
                      {m.valeur_stock.toLocaleString()} FCFA
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="md"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '16px 20px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
            },
            body: {
              padding: '20px',
            },
          }}
        >
          <Stack gap="md">
            <Text size="sm">1. Ce tableau montre l'état global des stocks de matières premières</Text>
            <Text size="sm">2. Le stock est calculé automatiquement (entrées - sorties)</Text>
            <Text size="sm">3. Le coût moyen est calculé selon la méthode du coût moyen pondéré</Text>
            <Text size="sm">4. Les articles en rouge sont en rupture de stock</Text>
            <Text size="sm">5. Les articles en orange sont en stock bas (≤ 5 unités)</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default StockGlobalPage;