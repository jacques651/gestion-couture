import React, { useEffect, useState } from 'react';

import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Select,
  NumberInput,
  Divider,
  Alert,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconUser,
  IconMoneybag,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconLock,
} from '@tabler/icons-react';
import {

  apiGet,
  apiPost,
  apiPut

} from '../../services/api';

interface Employe {
  id: number;
  nom_prenom: string;
}

interface Props {
  emprunt?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulaireEmprunt: React.FC<Props> = ({ emprunt, onSuccess, onCancel }) => {

  const [employeId, setEmployeId] = useState<string | null>(emprunt?.employe_id?.toString() || null);
  const [montant, setMontant] = useState<number | undefined>(emprunt?.montant);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const isDeduit = emprunt?.deduit === 1;

  useEffect(() => {

    const fetch =
      async () => {

        try {

          const res =
            await apiGet(
              "/employes"
            );

          setEmployes(
            res || []
          );

        } catch (error) {

          console.error(error);
        }
      };

    fetch();

  }, []);
  const employesOptions = employes.map(e => ({
    value: e.id.toString(),
    label: e.nom_prenom
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isDeduit) {
      setError("Impossible de modifier un emprunt déjà déduit");
      return;
    }

    if (!employeId) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    if (!montant || montant <= 0) {
      setError("Veuillez saisir un montant valide");
      return;
    }

    setLoading(true);

    try {

      if (emprunt) {

        await apiPut(

          `/emprunts/${emprunt.id}`,

          {

            employe_id:
              parseInt(employeId),

            montant
          }
        );

        setSuccess(
          'Emprunt modifié avec succès'
        );

      } else {

        await apiPost(

          "/emprunts",

          {

            employe_id:
              parseInt(employeId),

            montant
          }
        );

        setSuccess(
          'Emprunt ajouté avec succès'
        );
      }

      setTimeout(

        () => {

          onSuccess();

        },

        1500
      );

    } catch (err) {

      console.error(err);

      setError(

        "Erreur lors de l'enregistrement"
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconMoneybag size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {emprunt ? 'Modifier emprunt' : 'Nouvel emprunt'}
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
              {/* ALERTE MODIFICATION BLOQUÉE */}
              {isDeduit && (
                <Alert icon={<IconLock size={14} />} color="red" variant="light" p="xs">
                  <Group gap="xs">
                    <Text size="xs" fw={500}>⚠️ Emprunt déjà déduit du salaire</Text>
                    <Text size="xs">Modification impossible</Text>
                  </Group>
                </Alert>
              )}

              {/* SUCCÈS */}
              {success && (
                <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                  <Text size="xs">{success}</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* EMPLOYÉ */}
              <Select
                label="Employé"
                placeholder="Choisir un employé"
                data={employesOptions}
                value={employeId}
                onChange={setEmployeId}
                leftSection={<IconUser size={14} />}
                size="sm"
                disabled={isDeduit}
                required
                searchable
                nothingFoundMessage="Aucun employé trouvé"
              />

              {/* MONTANT */}
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Ex: 50000"
                value={montant}
                onChange={(val) =>

                  setMontant(

                    val === ''
                      ||
                      val === null
                      ||
                      val === undefined

                      ? undefined

                      : Number(val)
                  )
                }
                leftSection={<IconMoneybag size={14} />}
                size="sm"
                min={0}
                step={5000}
                disabled={isDeduit}
                required
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
                  disabled={isDeduit}
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {emprunt ? 'Mettre à jour' : 'Enregistrer'}
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
            <Text size="xs">1. Sélectionnez l'employé concerné</Text>
            <Text size="xs">2. Saisissez le montant de l'emprunt</Text>
            <Text size="xs">3. L'emprunt sera automatiquement déduit des salaires</Text>
            <Text size="xs">4. Un emprunt déjà déduit ne peut plus être modifié</Text>
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

export default FormulaireEmprunt;