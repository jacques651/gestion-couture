export const sauvegarderSession =
(
  utilisateur: any
) => {

  localStorage.setItem(

    "utilisateur",

    JSON.stringify(
      utilisateur
    )
  );
};

export const getUtilisateurConnecte =
() => {

  const data =
    localStorage.getItem(
      "utilisateur"
    );

  if (!data)
    return null;

  return JSON.parse(data);
};

export const supprimerSession =
() => {

  localStorage.removeItem(
    "utilisateur"
  );
};