import React, { useEffect, useState } from 'react';
import {
  Modal, Stack, Text, Group, Button, Select, NumberInput, TextInput,
  Paper, Alert, Divider, ThemeIcon,
} from '@mantine/core';
import {
  IconUser, IconTools, IconFileDescription,
  IconCoin, IconStack, IconCheck, IconPlus,
} from '@tabler/icons-react';
import {
  apiGet,
  apiPost,
  apiPut
} from '../../services/api';
import { notifications } from '@mantine/notifications';
import FormulaireTypePrestation from './FormulaireTypePrestation';

interface Employe {
  id: number;
  nom_prenom: string;
}

interface TypePrestation {
  id: number;
  nom: string;
  prix_par_defaut: number;
}

interface Props {
  prestation?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulairePrestationRealisee: React.FC<Props> = ({ prestation, onSuccess, onCancel }) => {
  const [employeId, setEmployeId] = useState<string>(prestation?.employe_id?.toString() || '');
  const [typeId, setTypeId] = useState<string>(prestation?.type_prestation_id?.toString() || '');
  const [designation, setDesignation] = useState(prestation?.designation || '');
  const [valeur, setValeur] = useState<number>(prestation?.valeur || 0);
  const [nombre, setNombre] = useState<number>(prestation?.nombre || 1);
  const [loading, setLoading] = useState(false);
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [types, setTypes] = useState<TypePrestation[]>([]);

  const loadTypes = async () => {

    try {

      const tp =
        await apiGet(
          "/types-prestations"
        );

      setTypes(tp || []);

    } catch (error) {

      console.error(error);
    }
  };

  useEffect(() => {

    const load = async () => {

      try {

        const emp =
          await apiGet(
            "/employes"
          );

        const filtered =
          emp.filter(
            (e: any) =>

              e.est_actif === 1

              &&

              e.type_remuneration
              ===
              'prestation'
          );

        setEmployes(filtered || []);

        await loadTypes();

      } catch (error) {

        console.error(error);
      }
    };

    load();

  }, []);

  const total = (valeur || 0) * (nombre || 1);

  const handleTypeChange = (val: string | null) => {
    if (val) {
      setTypeId(val);
      const t = types.find(x => String(x.id) === val);
      if (t) {
        setDesignation(t.nom);
        setValeur(t.prix_par_defaut);
      }
    } else {
      setTypeId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeId) { notifications.show({ title: 'Erreur', message: 'Choisir un employé', color: 'red' }); return; }
    if (!designation.trim()) { notifications.show({ title: 'Erreur', message: 'Saisir une désignation', color: 'red' }); return; }
    if (valeur <= 0) { notifications.show({ title: 'Erreur', message: 'Valeur invalide', color: 'red' }); return; }

    setLoading(true);
    try {

  if (prestation) {

    await apiPut(
      `/prestations-realisees/${prestation.id}`,
      {
        employe_id:
          parseInt(employeId),

        type_prestation_id:
          typeId
            ? parseInt(typeId)
            : null,

        designation,

        valeur,

        nombre,

        total
      }
    );

  } else {

    await apiPost(
      "/prestations-realisees",
      {
        employe_id:
          parseInt(employeId),

        type_prestation_id:
          typeId
            ? parseInt(typeId)
            : null,

        designation,

        valeur,

        nombre,

        total
      }
    );
  }

  notifications.show({
    title: 'Succès',

    message:
      'Prestation enregistrée',

    color: 'green'
  });

  onSuccess();

} catch (err: any) {

  console.error(err);

  notifications.show({
    title: 'Erreur',

    message:
      err.message || 'Erreur',

    color: 'red'
  });

} finally {

  setLoading(false);
}
};
  
  return (
    <>
      <Modal
        opened={true}
        onClose={onCancel}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" radius="md" color="white" variant="white">
              <IconTools size={18} color="#1b365d" />
            </ThemeIcon>
            <Text fw={700} size="md">{prestation ? 'Modifier la prestation' : 'Nouvelle prestation'}</Text>
          </Group>
        }
        size="md"
        centered
        radius="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {employes.length === 0 && (
              <Alert color="red" variant="light">Aucun employé en mode prestation disponible</Alert>
            )}

            <Select
              label="Employé"
              placeholder="Choisir un employé"
              data={employes.map(e => ({ value: String(e.id), label: e.nom_prenom }))}
              value={employeId}
              onChange={(val) => setEmployeId(val || '')}
              leftSection={<IconUser size={16} />}
              required
              searchable
              size="sm"
              radius="md"
            />

            <Group align="flex-end" gap="xs">
              <Select
                label="Type de prestation"
                placeholder="Optionnel"
                data={types.map(t => ({ value: String(t.id), label: `${t.nom} (${t.prix_par_defaut.toLocaleString()} FCFA)` }))}
                value={typeId}
                onChange={handleTypeChange}
                leftSection={<IconTools size={16} />}
                clearable
                searchable
                size="sm"
                radius="md"
                style={{ flex: 1 }}
              />
              <Button
                variant="light"
                size="sm"
                radius="md"
                leftSection={<IconPlus size={14} />}
                onClick={() => setShowNewTypeModal(true)}
              >
                Type
              </Button>
            </Group>

            <TextInput
              label="Désignation"
              placeholder="Description de la prestation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              leftSection={<IconFileDescription size={16} />}
              required
              size="sm"
              radius="md"
            />

            <Group grow>
              <NumberInput
                label="Valeur unitaire"
                placeholder="0"
                value={valeur}
                onChange={(val) => setValeur(typeof val === 'number' ? val : 0)}
                min={0}
                leftSection={<IconCoin size={16} />}
                size="sm"
                radius="md"
                thousandSeparator=" "
                suffix=" FCFA"
              />
              <NumberInput
                label="Quantité"
                placeholder="1"
                value={nombre}
                onChange={(val) => setNombre(typeof val === 'number' ? val : 1)}
                min={1}
                leftSection={<IconStack size={16} />}
                size="sm"
                radius="md"
              />
            </Group>

            <Paper p="md" radius="md" bg="blue.0" withBorder>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total</Text>
                <Text fw={700} size="xl" c="blue">{total.toLocaleString()} FCFA</Text>
              </Group>
            </Paper>

            <Divider />

            <Group justify="flex-end" gap="sm">
              <Button variant="light" size="sm" onClick={onCancel} radius="md">Annuler</Button>
              <Button type="submit" size="sm" loading={loading} radius="md" leftSection={<IconCheck size={16} />}>
                {prestation ? 'Modifier' : 'Enregistrer'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal nouveau type de prestation */}
      <Modal
        opened={showNewTypeModal}
        onClose={() => setShowNewTypeModal(false)}
        title="➕ Nouveau type de prestation"
        size="md"
        centered
        radius="md"
      >
        <FormulaireTypePrestation
          onSuccess={async () => {
            setShowNewTypeModal(false);
            await loadTypes();
            notifications.show({ title: 'Succès', message: 'Type créé', color: 'green' });
          }}
          onCancel={() => setShowNewTypeModal(false)}
        />
      </Modal>
    </>
  );
};

export default FormulairePrestationRealisee;