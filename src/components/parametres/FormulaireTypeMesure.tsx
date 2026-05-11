import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Divider,
  Alert,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconRuler,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  apiPost,
  apiPut
} from '../../services/api';
import { notifications } from '@mantine/notifications';

interface TypeMesure {
  id?: number;
  nom: string;
  unite: string;
}

interface FormulaireTypeMesureProps {
  type?: TypeMesure;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulaireTypeMesure: React.FC<FormulaireTypeMesureProps> = ({
  type,
  onSuccess,
  onCancel
}) => {
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<string | null>('cm');
  const [loading] = useState(false);
  const [error] = useState('');
  const [success] = useState(false);
  const [successMessage] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const unitesOptions = [
    { value: 'cm', label: 'Centimètres (cm)' },
    { value: 'm', label: 'Mètres (m)' },
    { value: 'pouce', label: 'Pouces' },
  ];

  useEffect(() => {
    if (type) {
      setNom(type.nom);
      setUnite(type.unite);
    }
  }, [type]);

const handleSubmit = async () => {

  try {

    if (
      type &&
      type.id
    ) {

      /**
       * UPDATE
       */
      await apiPut(

        `/types-mesures/${type.id}`,

        {
          nom:
            nom.trim(),

          unite,

          ordre_affichage:
            1,

          est_active:
            1
        }
      );

      notifications.show({

        title:
          "Succès",

        message:
          "Type de mesure modifié",

        color:
          "green"
      });

    } else {

      /**
       * CREATE
       */
      await apiPost(

        "/types-mesures",

        {
          nom:
            nom.trim(),

          unite,

          ordre_affichage:
            1,

          est_active:
            1
        }
      );

      notifications.show({

        title:
          "Succès",

        message:
          "Type de mesure créé",

        color:
          "green"
      });
    }

    onSuccess();

  } catch (err: any) {

    console.error(err);

    notifications.show({

      title:
        "Erreur",

      message:
        err.message,

      color:
        "red"
    });
  }
};

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconRuler size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {type ? 'Modifier le type de mesure' : 'Nouveau type de mesure'}
              </Title>
            </Group>
            <Group gap="xs">
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconInfoCircle size={14} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Aide
              </Button>
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconArrowLeft size={14} />}
                onClick={onCancel}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE PRINCIPAL */}
        <Card withBorder radius="md" p="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {/* SUCCÈS */}
              {success && (
                <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                  <Text size="xs">{successMessage}</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* NOM */}
              <TextInput
                label="Nom"
                placeholder="Ex: Tour de poitrine"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                leftSection={<IconRuler size={14} />}
                size="sm"
                required
              />

              {/* UNITÉ */}
              <Select
                label="Unité"
                placeholder="Choisir une unité"
                data={unitesOptions}
                value={unite}
                onChange={setUnite}
                leftSection={<IconRuler size={14} />}
                size="sm"
              />

              <Divider />

              {/* ACTIONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="red" onClick={onCancel}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  loading={loading}
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {type ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="sm"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '10px 12px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
            },
            body: {
              padding: '12px',
            },
          }}
        >
          <Stack gap="xs">
            <Text size="xs">1. Saisissez le nom du type de mesure</Text>
            <Text size="xs">2. Choisissez l'unité de mesure (cm, m, pouce)</Text>
            <Text size="xs">3. Sélectionnez une catégorie pour organiser les mesures</Text>
            <Text size="xs">4. Cliquez sur "Enregistrer" pour valider</Text>
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

export default FormulaireTypeMesure;