import { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconUsers,
  IconMoneybag,
} from '@tabler/icons-react';
import {

  apiGet

} from '../../services/api';


const AlertesFinancieres = () => {
  const [clientsDette, setClientsDette] = useState(0);
  const [employesDette, setEmployesDette] = useState(0);
  const [loading, setLoading] = useState(true);

 useEffect(() => {

  const load =
  async () => {

    try {

      setLoading(
        true
      );

      /**
       * =====================
       * VENTES
       * =====================
       */
      const ventes =
        (
          await apiGet(
            "/ventes"
          )
        ) || [];

      /**
       * =====================
       * EMPRUNTS
       * =====================
       */
      const emprunts =
        (
          await apiGet(
            "/emprunts"
          )
        ) || [];

      /**
       * =====================
       * CLIENTS IMPAYES
       * =====================
       */
      const clientsImpayes =

        ventes.filter(
          (v: any) => {

            const total =
              Number(
                v.montant_total || 0
              );

            const regle =
              Number(
                v.montant_regle || 0
              );

            return (
              total - regle
            ) > 0;
          }
        );

      /**
       * =====================
       * EMPRUNTS NON DEDUITS
       * =====================
       */
      const empruntsNonDeduits =

        emprunts.filter(
          (e: any) =>

            Number(
              e.deduit || 0
            ) === 0
        );

      /**
       * =====================
       * STATE
       * =====================
       */
      setClientsDette(
        clientsImpayes.length
      );

      setEmployesDette(
        empruntsNonDeduits.length
      );

    } catch (error) {

      console.error(
        "Erreur alertes financières :",
        error
      );

    } finally {

      setLoading(
        false
      );
    }
  };

  load();

}, []);
  const totalAlertes = clientsDette + employesDette;

  if (loading) {
    return (
      <Card withBorder radius="md" p="md">
        <Group gap="xs">
          <ThemeIcon size="md" color="yellow" variant="light">
            <IconAlertCircle size={16} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">Chargement des alertes...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      bg={totalAlertes > 0 ? 'yellow.0' : 'green.0'}
      style={{ borderLeft: `4px solid ${totalAlertes > 0 ? '#e6b800' : '#40c057'}` }}
    >
      <Stack gap="sm">
        {/* EN-TÊTE */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon
              size="md"
              color={totalAlertes > 0 ? 'yellow' : 'green'}
              variant="light"
              radius="xl"
            >
              {totalAlertes > 0 ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
            </ThemeIcon>
            <Text fw={600} size="sm" c={totalAlertes > 0 ? 'yellow.8' : 'green.8'}>
              Alertes financières
            </Text>
          </Group>
          {totalAlertes > 0 && (
            <Badge color="yellow" variant="light" size="sm">
              {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}
            </Badge>
          )}
        </Group>

        <Divider />

        {/* ALERTES */}
        <Stack gap="xs">
          {clientsDette > 0 && (
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs">
                <ThemeIcon size="sm" color="red" variant="light" radius="xl">
                  <IconUsers size={12} />
                </ThemeIcon>
                <Text size="sm" c="red.7">
                  Clients avec impayés
                </Text>
              </Group>
              <Badge color="red" variant="light" size="sm">
                {clientsDette} client{clientsDette > 1 ? 's' : ''}
              </Badge>
            </Group>
          )}

          {employesDette > 0 && (
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs">
                <ThemeIcon size="sm" color="orange" variant="light" radius="xl">
                  <IconMoneybag size={12} />
                </ThemeIcon>
                <Text size="sm" c="orange.7">
                  Emprunts non déduits
                </Text>
              </Group>
              <Badge color="orange" variant="light" size="sm">
                {employesDette} emprunt{employesDette > 1 ? 's' : ''}
              </Badge>
            </Group>
          )}

          {totalAlertes === 0 && (
            <Group gap="xs">
              <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
              <Text size="sm" c="green.7">
                Tout est en ordre 👍
              </Text>
            </Group>
          )}
        </Stack>

        {/* MESSAGE D'ACTION */}
        {totalAlertes > 0 && (
          <>
            <Divider />
            <Text size="xs" c="dimmed" fs="italic">
              {clientsDette > 0 && "Pensez à relancer les clients impayés. "}
              {employesDette > 0 && "Les emprunts non déduits seront pris sur les prochains salaires."}
            </Text>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default AlertesFinancieres;