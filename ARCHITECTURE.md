# Architecture d’intégration

Frankenstein-Labs doit rester une couche d’intégration autour de Coder, et non un fork opaque ni un faux moteur. Le control plane Coder, le serveur Coder, les agents, le CLI et le provisionnement Terraform restent les composants responsables de la gestion réelle des workspaces.

Une future interface propriétaire peut consommer l’API officielle Coder, mais elle doit conserver la séparation suivante : interface et adaptateurs; serveur Coder durable; PostgreSQL compatible Coder; provisionneurs Terraform; infrastructures d’exécution; stockage persistant; intégrations IA; logs et événements.

Vercel ne doit pas être utilisé comme hôte implicite du serveur Coder ou des workspaces persistants. Les templates cloud ne doivent pas être lancés sans identifiants et autorisation de dépense. Les fonctions d’arrêt automatique, de redémarrage, de quotas et de persistance doivent être configurées dans Coder et validées sur une infrastructure réelle.
