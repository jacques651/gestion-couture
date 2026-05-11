import React, { useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Divider,
  Alert,
  Box,
  Modal,
  Select,
  NumberInput,
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
  IconReceipt,
  IconDeviceFloppy,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconCategory,
  IconTag,
  IconMoneybag,
  IconUser,
  IconNotes,
  IconBuildingStore,
  IconPackage,
  IconScissors,
  IconTools,
  IconHome,
  IconGasStation,
  IconReceipt2,
  IconRefresh,
  IconCalendar,
} from '@tabler/icons-react';
import {

  apiPost,
  apiPut

} from '../../services/api';

const categories = [
  { value: 'transport', label: 'Transport', icon: IconGasStation, color: 'blue' },
  { value: 'fourniture', label: 'Fournitures', icon: IconPackage, color: 'green' },
  { value: 'tissu', label: 'Tissu', icon: IconScissors, color: 'pink' },
  { value: 'entretien', label: 'Entretien', icon: IconTools, color: 'yellow' },
  { value: 'eau-electricite', label: 'Eau/Électricité', icon: IconBuildingStore, color: 'cyan' },
  { value: 'loyer', label: 'Loyer', icon: IconHome, color: 'orange' },
  { value: 'autre', label: 'Autre', icon: IconCategory, color: 'gray' },
];

const getCategoryIcon = (categorieValue: string) => {
  const category = categories.find(c => c.value === categorieValue);
  if (!category) return <IconCategory size={16} />;
  const IconComponent = category.icon;
  return <IconComponent size={16} />;
};

const FormulaireDepense: React.FC<{
  depense?: any;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ depense, onSuccess, onCancel }) => {

  const [categorie, setCategorie] = useState(depense?.categorie || '');
  const [designation, setDesignation] = useState(depense?.designation || '');
  const [montant, setMontant] = useState<number | undefined>(depense?.montant);
  const [responsable, setResponsable] = useState(depense?.responsable || '');
  const [observation, setObservation] = useState(depense?.observation || '');
  const [dateDepense, setDateDepense] = useState<string>(
    depense?.date_depense || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!categorie) {
      errors.categorie = "La catégorie est requise";
    }

    if (!designation.trim()) {
      errors.designation = "La désignation est requise";
    }

    if (!montant || montant <= 0) {
      errors.montant = "Le montant doit être supérieur à 0";
    }

    if (!responsable.trim()) {
      errors.responsable = "Le responsable est requis";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {

      if (depense) {

        await apiPut(

          `/depenses/${depense.id}`,

          {

            categorie,
            designation,
            montant,
            responsable,
            observation,
            date_depense:
              dateDepense
          }
        );

        setSuccess(
          'Dépense modifiée avec succès'
        );

      } else {

        await apiPost(

          "/depenses",

          {

            categorie,
            designation,
            montant,
            responsable,
            observation,
            date_depense:
              dateDepense
          }
        );

        setSuccess(
          'Dépense ajoutée avec succès'
        );
      }

      setShowSuccess(true);

      setTimeout(() => {

        setShowSuccess(false);

        onSuccess();

      }, 2000);

    } catch (err: any) {

      setError(

        err.message
        ||
        'Erreur lors de l’enregistrement'
      );

    } finally {

      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategorie('');
    setDesignation('');
    setMontant(undefined);
    setResponsable('');
    setObservation('');
    setDateDepense(new Date().toISOString().split('T')[0]);
    setFieldErrors({});
  };

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
              <IconReceipt size={200} color="white" />
            </div>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconReceipt size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white" size="h3">
                    {depense ? "✏️ Modifier la dépense" : "💰 Nouvelle dépense"}
                  </Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    {depense
                      ? "Modifiez les informations de la dépense"
                      : "Enregistrez une nouvelle dépense de l'atelier"}
                  </Text>
                </Box>
              </Group>
              <Group>
                <Tooltip label="Aide">
                  <ActionIcon
                    variant="light"
                    color="white"
                    size="lg"
                    onClick={() => setInfoModalOpen(true)}
                  >
                    <IconInfoCircle size={20} />
                  </ActionIcon>
                </Tooltip>
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
                {/* SUCCÈS */}
                {showSuccess && (
                  <Alert
                    icon={<IconCheck size={16} />}
                    color="green"
                    variant="filled"
                  >
                    <Text size="sm" c="white">{success}</Text>
                    <Text size="xs" c="green.1" mt={4}>
                      Redirection en cours...
                    </Text>
                  </Alert>
                )}

                {/* ERREUR */}
                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="filled">
                    <Text size="sm" c="white">{error}</Text>
                  </Alert>
                )}

                {/* SECTION CATÉGORIE */}
                <div>
                  <Group gap="xs" mb="md">
                    <ThemeIcon variant="light" color="blue" size="sm" radius="md">
                      <IconCategory size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="sm" c="gray.7">Informations de la dépense</Text>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Select
                      label="Catégorie"
                      placeholder="Choisir une catégorie"
                      data={categories.map(c => ({
                        value: c.value,
                        label: c.label,
                      }))}
                      value={categorie}
                      onChange={(val) => {
                        setCategorie(val || '');
                        setFieldErrors(prev => ({ ...prev, categorie: '' }));
                      }}
                      leftSection={getCategoryIcon(categorie)}
                      size="md"
                      required
                      searchable
                      error={fieldErrors.categorie}
                    />

                    <TextInput
                      label="Date de la dépense"
                      type="date"
                      value={dateDepense}
                      onChange={(e) => setDateDepense(e.target.value)}
                      leftSection={<IconCalendar size={16} />}
                      size="md"
                    />
                  </SimpleGrid>
                </div>

                <Divider />

                {/* SECTION DÉTAILS */}
                <div>
                  <Group gap="xs" mb="md">
                    <ThemeIcon variant="light" color="green" size="sm" radius="md">
                      <IconReceipt2 size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="sm" c="gray.7">Détails de la dépense</Text>
                  </Group>

                  <Stack gap="md">
                    <TextInput
                      label="Désignation"
                      placeholder="Ex: Achat tissu, Transport, Réparation machine..."
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        setFieldErrors(prev => ({ ...prev, designation: '' }));
                      }}
                      leftSection={<IconTag size={16} />}
                      size="md"
                      required
                      error={fieldErrors.designation}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <NumberInput
                        label="Montant (FCFA)"
                        placeholder="Ex: 5000"
                        value={montant}
                        onChange={(val) => {
                          setMontant(Number(val));
                          setFieldErrors(prev => ({ ...prev, montant: '' }));
                        }}
                        leftSection={<IconMoneybag size={16} />}
                        size="md"
                        min={0}
                        step={500}
                        thousandSeparator=" "
                        required
                        error={fieldErrors.montant}
                      />

                      <TextInput
                        label="Responsable"
                        placeholder="Nom du responsable"
                        value={responsable}
                        onChange={(e) => {
                          setResponsable(e.target.value);
                          setFieldErrors(prev => ({ ...prev, responsable: '' }));
                        }}
                        leftSection={<IconUser size={16} />}
                        size="md"
                        required
                        error={fieldErrors.responsable}
                      />
                    </SimpleGrid>

                    <Textarea
                      label="Observation"
                      placeholder="Notes supplémentaires concernant cette dépense..."
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      leftSection={<IconNotes size={16} />}
                      size="md"
                      rows={3}
                    />
                  </Stack>
                </div>

                {/* RÉSUMÉ */}
                {montant && montant > 0 && (
                  <Paper withBorder p="md" radius="md" bg="gray.0">
                    <Group justify="space-between">
                      <Text size="sm" fw={500} c="gray.6">Résumé</Text>
                      <Badge size="lg" variant="filled" color="blue" style={{ fontSize: 14 }}>
                        {montant.toLocaleString()} FCFA
                      </Badge>
                    </Group>
                    {categorie && (
                      <Text size="xs" c="dimmed" mt={4}>
                        Catégorie: {categories.find(c => c.value === categorie)?.label || categorie}
                      </Text>
                    )}
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
                    loading={isSubmitting}
                    leftSection={<IconDeviceFloppy size={16} />}
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  >
                    {depense ? "Mettre à jour" : "Enregistrer la dépense"}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>

          {/* MODAL INSTRUCTIONS */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={
              <Group gap="xs">
                <IconInfoCircle size={18} />
                <Text fw={600}>Guide d'utilisation</Text>
              </Group>
            }
            size="md"
            centered
            radius="lg"
          >
            <Stack gap="md">
              <Paper p="sm" bg="blue.0" radius="md">
                <Text size="sm" fw={500} mb="xs">📝 Informations générales</Text>
                <Text size="xs" c="dimmed">• Sélectionnez une catégorie de dépense</Text>
                <Text size="xs" c="dimmed">• La date par défaut est aujourd'hui</Text>
                <Text size="xs" c="dimmed">• Tous les champs marqués * sont obligatoires</Text>
              </Paper>

              <Paper p="sm" bg="green.0" radius="md">
                <Text size="sm" fw={500} mb="xs">💰 Montant</Text>
                <Text size="xs" c="dimmed">• Saisissez le montant en FCFA</Text>
                <Text size="xs" c="dimmed">• Utilisez les flèches pour incrémenter par 500 FCFA</Text>
                <Text size="xs" c="dimmed">• Le montant doit être supérieur à 0</Text>
              </Paper>

              <Paper p="sm" bg="orange.0" radius="md">
                <Text size="sm" fw={500} mb="xs">💡 Conseils</Text>
                <Text size="xs" c="dimmed">• Renseignez toujours le responsable de la dépense</Text>
                <Text size="xs" c="dimmed">• Ajoutez des observations pour un meilleur suivi</Text>
                <Text size="xs" c="dimmed">• Utilisez le bouton "Réinitialiser" pour vider le formulaire</Text>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 2.0.0 - Gestion Couture Pro
              </Text>
            </Stack>
          </Modal>
        </Stack>
      </Box>
    </Container>
  );
};

export default FormulaireDepense;