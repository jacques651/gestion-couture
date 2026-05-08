import { useState } from 'react';
import { journaliserAction } from "../../services/journal";
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
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
  IconPhone,
  IconWallet,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

const FormulaireEmploye = ({ employe, onSuccess, onCancel }: any) => {

  const [nomPrenom, setNomPrenom] = useState(employe?.nom_prenom || '');
  const [telephone, setTelephone] = useState(employe?.telephone || '');
  const [type, setType] = useState<string | null>(employe?.type_remuneration || null);
  const [salaire, setSalaire] = useState<number | undefined>(employe?.salaire_base || undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const typeOptions = [
    { value: 'fixe', label: '💰 Salaire fixe' },
    { value: 'prestation', label: '📊 Prestation (à la tâche)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (!type) {
      setError("Veuillez choisir un type de rémunération");
      return;
    }

    if (type === 'fixe' && (!salaire || salaire <= 0)) {
      setError("Veuillez saisir un salaire valide");
      return;
    }

    if (!nomPrenom.trim()) {
      setError("Le nom complet est requis");
      return;
    }

    setLoading(true);

    try {
      const db = await getDb();
      const salaireFinal = type === 'fixe' ? salaire : 0;

      if (employe) {

        await db.execute(
          `
    UPDATE employes
    SET nom_prenom=?,
        telephone=?,
        type_remuneration=?,
        salaire_base=?
    WHERE id=?
    `,
          [
            nomPrenom,
            telephone || null,
            type,
            salaireFinal,
            employe.id
          ]
        );

        // Journalisation modification
        await journaliserAction({
          utilisateur: 'Utilisateur',
          action: 'UPDATE',
          table: 'employes',
          idEnregistrement: employe.id,
          details: `Modification employé : ${nomPrenom}`
        });

        setSuccess('Employé modifié avec succès');

      } else {

        await db.execute(
          `
    INSERT INTO employes (
      nom_prenom,
      telephone,
      type_remuneration,
      salaire_base
    )
    VALUES (?, ?, ?, ?)
    `,
          [
            nomPrenom,
            telephone || null,
            type,
            salaireFinal
          ]
        );

        // Journalisation création
        await journaliserAction({
          utilisateur: 'Utilisateur',
          action: 'CREATE',
          table: 'employes',
          idEnregistrement: nomPrenom,
          details: `Création employé : ${nomPrenom}`
        });

        setSuccess('Employé ajouté avec succès');
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
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
              <IconUser size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {employe ? 'Modifier employé' : 'Nouvel employé'}
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
                  <Text size="xs">{success}</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* NOM COMPLET */}
              <TextInput
                label="Nom complet"
                placeholder="Ex: KORGO Jacques"
                value={nomPrenom}
                onChange={(e) => setNomPrenom(e.target.value)}
                leftSection={<IconUser size={14} />}
                size="sm"
                required
              />

              {/* TÉLÉPHONE */}
              <TextInput
                label="Téléphone"
                placeholder="Ex: 75 11 81 61"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                leftSection={<IconPhone size={14} />}
                size="sm"
              />

              {/* TYPE DE RÉMUNÉRATION */}
              <Select
                label="Type de rémunération"
                placeholder="Choisir un type"
                data={typeOptions}
                value={type}
                onChange={setType}
                leftSection={<IconWallet size={14} />}
                size="sm"
                required
              />

              {/* SALAIRE FIXE */}
              {type === 'fixe' && (
                <NumberInput
                  label="Salaire mensuel (FCFA)"
                  placeholder="Ex: 75000"
                  value={salaire}
                  onChange={(val) => setSalaire(Number(val))}
                  leftSection="FCFA"
                  size="sm"
                  min={0}
                  step={5000}
                  required
                />
              )}

              {/* INFO PRESTATION */}
              {type === 'prestation' && (
                <Alert color="blue" variant="light" p="xs">
                  <Group gap="xs">
                    <IconInfoCircle size={14} />
                    <Text size="xs">
                      Le salaire sera calculé automatiquement à partir des prestations
                    </Text>
                  </Group>
                </Alert>
              )}

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
                  {employe ? 'Mettre à jour' : 'Enregistrer'}
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
            <Text size="xs">1. Renseignez le nom complet de l'employé</Text>
            <Text size="xs">2. Ajoutez le téléphone (optionnel)</Text>
            <Text size="xs">3. Choisissez le type de rémunération</Text>
            <Text size="xs">4. Pour un salaire fixe, saisissez le montant mensuel</Text>
            <Text size="xs">5. Pour une prestation, le salaire est automatique</Text>
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

export default FormulaireEmploye;