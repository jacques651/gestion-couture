// src/components/ventes/ListeProduits.tsx
import React from 'react';
import { Card, Title, Group, TextInput, ActionIcon, ScrollArea, Table, Badge, Box, Text, Tooltip } from '@mantine/core';
import { IconSearch, IconRefresh, IconPlus } from '@tabler/icons-react';
import { Article, Matiere } from '../../types';

interface ListeProduitsProps {
  type: 'pret_a_porter' | 'matiere';
  articles: Article[];
  matieres: Matiere[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddArticle: (article: Article) => void;
  onAddMatiere: (matiere: Matiere) => void;
  couleurs: any[];
  tailles: any[];
}

const ListeProduits: React.FC<ListeProduitsProps> = ({
  type,
  articles,
  matieres,
  searchTerm,
  onSearchChange,
  onRefresh,
  onAddArticle,
  onAddMatiere,
  couleurs,
  tailles,
}) => {
  // Filtrer les articles si c'est le type 'pret_a_porter'
  const filteredArticles = type === 'pret_a_porter' 
    ? articles.filter(a => {
        const search = searchTerm.toLowerCase();
        return (a.modele || a.type_tenue || '').toLowerCase().includes(search) ||
               (a.couleur || '').toLowerCase().includes(search) ||
               (a.taille || '').toLowerCase().includes(search);
      })
    : [];

  // Filtrer les matières si c'est le type 'matiere'
  const filteredMatieres = type === 'matiere'
    ? matieres.filter(m => {
        const search = searchTerm.toLowerCase();
        return (m.designation || '').toLowerCase().includes(search) ||
               (m.code_matiere || '').toLowerCase().includes(search);
      })
    : [];

  return (
    <Card withBorder radius="lg" shadow="sm" p="md">
      <Group justify="space-between" mb="sm">
        <Title order={5}>📦 {type === 'pret_a_porter' ? 'Articles disponibles' : 'Matières disponibles'}</Title>
        <Group gap="xs">
          <TextInput 
            placeholder="Rechercher..." 
            leftSection={<IconSearch size={14} />} 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            size="xs" 
            radius="md" 
            style={{ width: 200 }} 
          />
          <Tooltip label="Actualiser">
            <ActionIcon variant="light" onClick={onRefresh} size="sm" radius="md">
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <ScrollArea h={350} offsetScrollbars>
        <Table striped highlightOnHover style={{ fontSize: 12 }}>
          <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}>
            <Table.Tr>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px' }}>Désignation</Table.Th>
              {type === 'pret_a_porter' && (
                <>
                  <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50, textAlign: 'center' }}>Taille</Table.Th>
                  <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 80 }}>Couleur</Table.Th>
                </>
              )}
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 80, textAlign: 'right' }}>Prix</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50, textAlign: 'center' }}>Stock</Table.Th>
              <Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {type === 'pret_a_porter' ? (
              // 🔥 Affichage des articles (Prêt-à-porter)
              filteredArticles.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" size="sm" c="dimmed" py={20}>
                      {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun article disponible'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredArticles.map(article => {
                  const cc = couleurs?.find(c => c?.nom_couleur === article?.couleur);
                  const tt = tailles?.find(t => t?.libelle === article?.taille);
                  return (
                    <Table.Tr key={article.id}>
                      <Table.Td style={{ padding: '4px 8px' }}>
                        <Text size="xs" fw={600}>{article.modele || article.type_tenue || 'Article'}</Text>
                        {article.categorie && article.categorie !== 'undefined' && (
                          <Text size="10px" c="dimmed">{article.categorie}</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <Badge size="xs" variant="light" color="blue">
                          {tt?.code_taille || article.taille || 'N/A'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '4px 8px' }}>
                        <Group gap={6} wrap="nowrap">
                          <Box w={12} h={12} style={{ backgroundColor: cc?.code_hex || '#ccc', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.2)' }} />
                          <Text size="xs">{article.couleur || 'N/A'}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <Text size="xs" fw={600} c="green">
                          {article.prix_vente.toLocaleString()} FCFA
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <Badge size="xs" color={article.quantite_stock < 5 ? 'orange' : 'green'}>
                          {article.quantite_stock}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '4px 8px' }}>
                        <ActionIcon 
                          variant="light" 
                          color="blue" 
                          size="sm" 
                          onClick={() => onAddArticle(article)}
                          disabled={article.quantite_stock === 0}
                        >
                          <IconPlus size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )
            ) : (
              // 🔥 Affichage des matières
              filteredMatieres.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" size="sm" c="dimmed" py={20}>
                      {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucune matière disponible'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredMatieres.map(matiere => (
                  <Table.Tr key={matiere.id}>
                    <Table.Td style={{ padding: '4px 8px' }}>
                      <Text size="xs" fw={600}>{matiere.designation}</Text>
                      <Text size="10px" c="dimmed">
                        {matiere.code_matiere} {matiere.unite ? `- ${matiere.unite}` : ''}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}>
                      <Text size="xs" c="dimmed">-</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <Badge size="xs" color={matiere.stock_actuel < 5 ? 'orange' : 'green'}>
                        {matiere.stock_actuel}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ padding: '4px 8px' }}>
                      <ActionIcon 
                        variant="light" 
                        color="blue" 
                        size="sm" 
                        onClick={() => onAddMatiere(matiere)}
                        disabled={matiere.stock_actuel === 0}
                      >
                        <IconPlus size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))
              )
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
};

export default ListeProduits;