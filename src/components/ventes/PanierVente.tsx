// src/components/ventes/PanierVente.tsx
import React from 'react';
import { Card, Title, ScrollArea, Table, Text, Badge, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { PanierItem } from '../../hooks/usePanier';

interface PanierVenteProps {
  panier: PanierItem[];
  onRemoveItem: (index: number) => void;
}

const PanierVente: React.FC<PanierVenteProps> = ({ panier, onRemoveItem }) => {
  if (panier.length === 0) return null;

  return (
    <Card withBorder radius="lg" shadow="sm" p="md">
      <Title order={5} mb="sm">🛒 Produits sélectionnés ({panier.length})</Title>
      <ScrollArea h={250} offsetScrollbars>
        <Table striped highlightOnHover style={{ fontSize: 12 }}>
          <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}>
            <Table.Tr>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px' }}>Désignation</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 100, textAlign: 'right' }}>Prix unitaire</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 60, textAlign: 'center' }}>Qté</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 100, textAlign: 'right' }}>Total</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {panier.map((item, idx) => (
              <Table.Tr key={item.id || idx}>
                <Table.Td style={{ padding: '4px 8px' }}>
                  <Text size="xs" fw={500}>{item.designation}</Text>
                  {item.taille && <Text size="10px" c="dimmed">Taille: {item.taille}</Text>}
                  {item.couleur && <Text size="10px" c="dimmed">Couleur: {item.couleur}</Text>}
                </Table.Td>
                <Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <Text size="xs">{item.prixUnitaire.toLocaleString()} FCFA</Text>
                </Table.Td>
                <Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <Badge size="xs" variant="light" color="blue">{item.quantite}</Badge>
                </Table.Td>
                <Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <Text size="xs" fw={600} c="green">{item.total.toLocaleString()} FCFA</Text>
                </Table.Td>
                <Table.Td style={{ padding: '4px 8px' }}>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemoveItem(idx)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
};

export default PanierVente;