// src/components/matieres/FormulaireMatiere.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  Stack,
  Divider,
  Box,
  Alert,
  Avatar,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Tooltip,
  ActionIcon,
  Container,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPackage,
  IconTag,
  IconCategory,
  IconRuler,
  IconShoppingCart,
  IconAlertTriangle,
  IconBuildingStore,
  IconMapPin,
  IconRefresh,
  IconInfoCircle,
  IconBox,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

// Interface alignée avec la base de données
export interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  categorie_id: number | null;
  categorie_nom?: string;
  unite: string;
  prix_achat: number;
  prix_vente?: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur?: string;
  emplacement?: string;
  est_supprime: number;
}

interface FormulaireMatiereProps {
  matiere?: Matiere;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Categorie {
  id: number;
  nom_categorie: string;
}

const FormulaireMatiere: React.FC<FormulaireMatiereProps> = ({ matiere, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeMatiere, setCodeMatiere] = useState('');
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    designation: '',
    categorie_id: null as number | null,
    unite: 'mètre',
    prix_achat: 0,
    stock_actuel: 0,
    seuil_alerte: 0,
    reference_fournisseur: '',
    emplacement: '',
  });

  const unites = [
    { value: 'mètre', label: 'Mètre (m)', icon: IconRuler },
    { value: 'kg', label: 'Kilogramme (kg)', icon: IconPackage },
    { value: 'pièce', label: 'Pièce', icon: IconBox },
    { value: 'rouleau', label: 'Rouleau', icon: IconShoppingCart },
    { value: 'bobine', label: 'Bobine', icon: IconPackage },
  ];

  const getUniteIcon = (uniteValue: string) => {
    const unite = unites.find(u => u.value === uniteValue);
    if (!unite) return <IconRuler size={16} />;
    const IconComponent = unite.icon;
    return <IconComponent size={16} />;
  };

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      const db = await getDb();
      const result = await db.select<Categorie[]>(`
        SELECT id, nom_categorie FROM categories_matieres WHERE est_actif = 1 ORDER BY nom_categorie
      `);
      setCategories(result);
    };
    loadCategories();
  }, []);

  // Générer le code matière automatiquement
  useEffect(() => {
    const generateCode = async () => {
      if (!matiere) {
        setGeneratingCode(true);
        const db = await getDb();
        const result = await db.select<{ maxCode: string }[]>(
          "SELECT code_matiere FROM matieres ORDER BY id DESC LIMIT 1"
        );
        
        let newCode = 'MAT-0001';
        if (result.length > 0 && result[0].maxCode) {
          const lastNumber = parseInt(result[0].maxCode.split('-')[1]);
          newCode = `MAT-${(lastNumber + 1).toString().padStart(4, '0')}`;
        }
        
        setCodeMatiere(newCode);
        setGeneratingCode(false);
      }
    };
    generateCode();
  }, [matiere]);

  // Remplir le formulaire si édition
  useEffect(() => {
    if (matiere) {
      setFormData({
        designation: matiere.designation,
        categorie_id: matiere.categorie_id || null,
        unite: matiere.unite || 'mètre',
        prix_achat: matiere.prix_achat || 0,
        stock_actuel: matiere.stock_actuel || 0,
        seuil_alerte: matiere.seuil_alerte || 0,
        reference_fournisseur: matiere.reference_fournisseur || '',
        emplacement: matiere.emplacement || '',
      });
      setCodeMatiere(matiere.code_matiere);
    }
  }, [matiere]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.designation.trim()) {
      errors.designation = "La désignation est requise";
    }
    
    if (!formData.unite) {
      errors.unite = "L'unité de mesure est requise";
    }
    
    if (formData.prix_achat < 0) {
      errors.prix_achat = "Le prix d'achat ne peut pas être négatif";
    }
    
    if (formData.stock_actuel < 0) {
      errors.stock_actuel = "Le stock ne peut pas être négatif";
    }
    
    if (formData.seuil_alerte < 0) {
      errors.seuil_alerte = "Le seuil d'alerte ne peut pas être négatif";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notifications.show({
        title: 'Erreur de validation',
        message: 'Veuillez corriger les erreurs dans le formulaire',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    const db = await getDb();

    try {
      if (matiere) {
        // Modification
        await db.execute(`
          UPDATE matieres 
          SET designation = ?, categorie_id = ?, unite = ?, 
              prix_achat = ?, seuil_alerte = ?,
              reference_fournisseur = ?, emplacement = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          formData.designation,
          formData.categorie_id,
          formData.unite,
          formData.prix_achat,
          formData.seuil_alerte,
          formData.reference_fournisseur || null,
          formData.emplacement || null,
          matiere.id,
        ]);
        
        notifications.show({
          title: 'Succès',
          message: 'Matière modifiée avec succès',
          color: 'green',
        });
      } else {
        // Création
        await db.execute(`
          INSERT INTO matieres (
            code_matiere, designation, categorie_id, unite, 
            prix_achat, stock_actuel, seuil_alerte,
            reference_fournisseur, emplacement, est_supprime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `, [
          codeMatiere,
          formData.designation,
          formData.categorie_id,
          formData.unite,
          formData.prix_achat,
          formData.stock_actuel,
          formData.seuil_alerte,
          formData.reference_fournisseur || null,
          formData.emplacement || null,
        ]);
        
        notifications.show({
          title: 'Succès',
          message: `Matière "${formData.designation}" créée avec succès`,
          color: 'green',
        });
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'enregistrement',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      designation: '',
      categorie_id: null,
      unite: 'mètre',
      prix_achat: 0,
      stock_actuel: 0,
      seuil_alerte: 0,
      reference_fournisseur: '',
      emplacement: '',
    });
    setFieldErrors({});
    
    notifications.show({
      title: 'Formulaire réinitialisé',
      message: 'Tous les champs ont été remis à zéro',
      color: 'blue',
    });
  };

  const categoryOptions = categories.map(c => ({
    value: c.id.toString(),
    label: c.nom_categorie,
  }));

  const selectedCategory = categories.find(c => c.id === formData.categorie_id);

  return (
    <Container size="lg" p={0}>
      <Box style={{ maxWidth: 800, margin: '0 auto' }} p="md">
        <Stack gap="lg">
          {/* HEADER MODERNE */}
          <Card 
            withBorder 
            radius="lg" 
            p="xl" 
            style={{ 
              background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.1 }}>
              <IconPackage size={200} color="white" />
            </div>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconPackage size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white" size="h3">
                    {matiere ? "✏️ Modifier la matière" : "📦 Nouvelle matière"}
                  </Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    {matiere 
                      ? "Modifiez les informations de la matière première" 
                      : "Ajoutez une nouvelle matière première à l'inventaire"}
                  </Text>
                </Box>
              </Group>
              <Group>
                <Tooltip label="Retour">
                  <ActionIcon 
                    variant="light" 
                    color="white" 
                    size="lg" 
                    onClick={onCancel}
                  >
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>

          {/* FORMULAIRE PRINCIPAL */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                {/* CODE MATIÈRE */}
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="blue" size="sm" radius="md">
                        <IconTag size={14} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>Code matière</Text>
                    </Group>
                    <Badge size="lg" variant="filled" color="blue" style={{ fontSize: 16 }}>
                      {codeMatiere}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    Code généré automatiquement et unique
                  </Text>
                </Paper>

                <Divider label="Informations générales" labelPosition="center" />

                {/* DÉSIGNATION */}
                <TextInput
                  label="Désignation *"
                  placeholder="Ex: Wax premium, Coton bio, Polyester..."
                  value={formData.designation}
                  onChange={(e) => {
                    setFormData({ ...formData, designation: e.target.value });
                    setFieldErrors(prev => ({ ...prev, designation: '' }));
                  }}
                  leftSection={<IconTag size={16} />}
                  size="md"
                  required
                  error={fieldErrors.designation}
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {/* CATÉGORIE */}
                  <Select
                    label="Catégorie"
                    placeholder="Sélectionnez une catégorie"
                    data={categoryOptions}
                    value={formData.categorie_id?.toString()}
                    onChange={(val) => setFormData({ ...formData, categorie_id: val ? parseInt(val) : null })}
                    leftSection={<IconCategory size={16} />}
                    size="md"
                    clearable
                  />

                  {/* UNITÉ */}
                  <Select
                    label="Unité de mesure *"
                    placeholder="Sélectionnez une unité"
                    data={unites}
                    value={formData.unite}
                    onChange={(value) => {
                      setFormData({ ...formData, unite: value || 'mètre' });
                      setFieldErrors(prev => ({ ...prev, unite: '' }));
                    }}
                    leftSection={getUniteIcon(formData.unite)}
                    size="md"
                    required
                    error={fieldErrors.unite}
                  />
                </SimpleGrid>

                <Divider label="Informations commerciales" labelPosition="center" />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {/* PRIX D'ACHAT */}
                  <NumberInput
                    label="Prix d'achat (FCFA)"
                    placeholder="0"
                    value={formData.prix_achat}
                    onChange={(val) => {
                      setFormData({ ...formData, prix_achat: Number(val) || 0 });
                      setFieldErrors(prev => ({ ...prev, prix_achat: '' }));
                    }}
                    leftSection={<IconShoppingCart size={16} />}
                    size="md"
                    min={0}
                    step={100}
                    thousandSeparator=" "
                    error={fieldErrors.prix_achat}
                  />

                  {/* STOCK INITIAL */}
                  <NumberInput
                    label="Stock initial"
                    placeholder="0"
                    value={formData.stock_actuel}
                    onChange={(val) => {
                      setFormData({ ...formData, stock_actuel: Number(val) || 0 });
                      setFieldErrors(prev => ({ ...prev, stock_actuel: '' }));
                    }}
                    leftSection={<IconPackage size={16} />}
                    size="md"
                    min={0}
                    step={1}
                    error={fieldErrors.stock_actuel}
                  />
                </SimpleGrid>

                {/* SEUIL D'ALERTE */}
                <NumberInput
                  label="Seuil d'alerte"
                  placeholder="0"
                  value={formData.seuil_alerte}
                  onChange={(val) => {
                    setFormData({ ...formData, seuil_alerte: Number(val) || 0 });
                    setFieldErrors(prev => ({ ...prev, seuil_alerte: '' }));
                  }}
                  leftSection={<IconAlertTriangle size={16} />}
                  size="md"
                  min={0}
                  step={1}
                  description="Alerte quand le stock est inférieur à cette valeur"
                  error={fieldErrors.seuil_alerte}
                />

                <Divider label="Informations supplémentaires" labelPosition="center" />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Référence fournisseur"
                    placeholder="Référence chez le fournisseur"
                    value={formData.reference_fournisseur}
                    onChange={(e) => setFormData({ ...formData, reference_fournisseur: e.target.value })}
                    leftSection={<IconBuildingStore size={16} />}
                    size="md"
                  />

                  <TextInput
                    label="Emplacement"
                    placeholder="Rayon, étagère, casier..."
                    value={formData.emplacement}
                    onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                    leftSection={<IconMapPin size={16} />}
                    size="md"
                  />
                </SimpleGrid>

                {/* ALERTE SEUIL */}
                {formData.seuil_alerte > 0 && (
                  <Alert 
                    color={formData.stock_actuel <= formData.seuil_alerte ? "orange" : "blue"} 
                    variant="light"
                    icon={formData.stock_actuel <= formData.seuil_alerte ? <IconAlertTriangle size={16} /> : <IconInfoCircle size={16} />}
                  >
                    <Group justify="space-between">
                      <Text size="sm">
                        {formData.stock_actuel <= formData.seuil_alerte 
                          ? `⚠️ Stock bas ! Actuel: ${formData.stock_actuel} ${formData.unite}`
                          : `✅ Niveau de stock OK - Seuil d'alerte: ${formData.seuil_alerte} ${formData.unite}`}
                      </Text>
                      <Badge color={formData.stock_actuel <= formData.seuil_alerte ? "orange" : "green"} variant="light">
                        {formData.stock_actuel} stock
                      </Badge>
                    </Group>
                  </Alert>
                )}

                {/* RÉSUMÉ */}
                {formData.designation && (
                  <Paper withBorder p="md" radius="md" bg="gray.0">
                    <Text size="xs" fw={600} c="gray.6" mb="xs">Résumé de la matière</Text>
                    <SimpleGrid cols={2} spacing="xs">
                      <Text size="xs" c="dimmed">Désignation:</Text>
                      <Text size="xs" fw={500}>{formData.designation}</Text>
                      {selectedCategory && (
                        <>
                          <Text size="xs" c="dimmed">Catégorie:</Text>
                          <Text size="xs" fw={500}>{selectedCategory.nom_categorie}</Text>
                        </>
                      )}
                      <Text size="xs" c="dimmed">Unité:</Text>
                      <Text size="xs" fw={500}>{unites.find(u => u.value === formData.unite)?.label || formData.unite}</Text>
                      <Text size="xs" c="dimmed">Prix d'achat:</Text>
                      <Text size="xs" fw={500}>{formData.prix_achat.toLocaleString()} FCFA</Text>
                    </SimpleGrid>
                  </Paper>
                )}

                <Divider />

                {/* ACTIONS */}
                <Group justify="space-between">
                  <Group>
                    <Button
                      size="md"
                      variant="outline"
                      color="red"
                      onClick={onCancel}
                      leftSection={<IconArrowLeft size={16} />}
                    >
                      Annuler
                    </Button>
                    <Tooltip label="Réinitialiser le formulaire">
                      <ActionIcon
                        variant="outline"
                        color="gray"
                        size="md"
                        onClick={resetForm}
                      >
                        <IconRefresh size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Button
                    size="md"
                    type="submit"
                    loading={loading || generatingCode}
                    leftSection={<IconDeviceFloppy size={16} />}
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  >
                    {matiere ? "Mettre à jour" : "Enregistrer la matière"}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
};

export default FormulaireMatiere;