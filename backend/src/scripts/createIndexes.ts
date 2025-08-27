// scripts/createIndexes.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface IndexInfo {
  collection: string;
  indexes: Array<{
    name: string;
    spec: any;
    options?: any;
  }>;
}

const INDEXES_CONFIG: IndexInfo[] = [
  {
    collection: 'icnpinterventions',
    indexes: [
      {
        name: 'text_search_index',
        spec: {
          'term.fr': 'text',
          'term.en': 'text',
          'description.fr': 'text',
          'description.en': 'text'
        },
        options: {
          name: 'text_search_index',
          default_language: 'french',
          language_override: 'language',
          weights: {
            'term.fr': 10,
            'term.en': 8,
            'description.fr': 5,
            'description.en': 3
          }
        }
      },
      {
        name: 'icnp_id_index',
        spec: { icnp_id: 1 },
        options: { unique: true }
      },
      {
        name: 'axis_index',
        spec: { axis: 1 }
      },
      {
        name: 'compound_axis_icnp_index',
        spec: { axis: 1, icnp_id: 1 }
      }
    ]
  },
  {
    collection: 'patient2s',
    indexes: [
      {
        name: 'nom_prenom_index',
        spec: { nom: 1, prenom: 1 }
      },
      {
        name: 'email_unique_index',
        spec: { email: 1 },
        options: { unique: true, sparse: true }
      },
      {
        name: 'ipp_index',
        spec: { ipp: 1 },
        options: { sparse: true }
      },
      {
        name: 'situation_dossier_index',
        spec: { situationDossier: 1 }
      },
      {
        name: 'date_prise_en_charge_index',
        spec: { dateDebutPriseEnCharge: 1 }
      },
      {
        name: 'actions_icnp_id_index',
        spec: { 'actions.icnp.id': 1 }
      },
      {
        name: 'actions_date_index',
        spec: { 'actions.date': 1 }
      },
      {
        name: 'adresse_geospatial_index',
        spec: { 'adresse.latitude': 1, 'adresse.longitude': 1 }
      }
    ]
  },
  {
    collection: 'tasks',
    indexes: [
      {
        name: 'user_date_index',
        spec: { userId: 1, date: 1 }
      },
      {
        name: 'patient_date_index',
        spec: { patientId: 1, date: 1 },
        options: { sparse: true }
      },
      {
        name: 'icnp_id_index',
        spec: { 'icnp.id': 1 },
        options: { sparse: true }
      },
      {
        name: 'completed_date_index',
        spec: { completed: 1, date: 1 }
      }
    ]
  },
  {
    collection: 'users',
    indexes: [
      {
        name: 'email_unique_index',
        spec: { email: 1 },
        options: { unique: true }
      },
      {
        name: 'role_index',
        spec: { role: 1 }
      },
      {
        name: 'lastLogin_index',
        spec: { lastLogin: 1 },
        options: { sparse: true }
      }
    ]
  }
];

async function createIndexes() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI non définie dans les variables d\'environnement');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    
    for (const collectionConfig of INDEXES_CONFIG) {
      const { collection, indexes } = collectionConfig;
      
      console.log(`\n📋 Traitement de la collection: ${collection}`);
      
      // Vérifier si la collection existe
      const collections = await db.listCollections({ name: collection }).toArray();
      if (collections.length === 0) {
        console.log(`⚠️  Collection ${collection} n'existe pas, création...`);
        await db.createCollection(collection);
      }

      const coll = db.collection(collection);

      // Supprimer les anciens index (sauf _id)
      try {
        const existingIndexes = await coll.listIndexes().toArray();
        const indexesToDrop = existingIndexes
          .filter(idx => idx.name !== '_id_')
          .map(idx => idx.name);

        if (indexesToDrop.length > 0) {
          console.log(`🗑️  Suppression des anciens index: ${indexesToDrop.join(', ')}`);
          await coll.dropIndexes(indexesToDrop);
        }
      } catch (error: any) {
        if (!error.message.includes('ns not found')) {
          console.warn(`⚠️  Attention lors de la suppression des index: ${error.message}`);
        }
      }

      // Créer les nouveaux index
      for (const indexConfig of indexes) {
        const { name, spec, options = {} } = indexConfig;
        
        try {
          console.log(`  ➕ Création de l'index: ${name}`);
          await coll.createIndex(spec, { name, ...options });
          console.log(`  ✅ Index ${name} créé avec succès`);
        } catch (error: any) {
          if (error.code === 85) { // Index already exists
            console.log(`  ℹ️  Index ${name} existe déjà`);
          } else {
            console.error(`  ❌ Erreur création index ${name}:`, error.message);
          }
        }
      }
    }

    console.log('\n🎉 Tous les index ont été créés avec succès !');
    
    // Vérification finale
    console.log('\n📊 Vérification des index créés:');
    for (const { collection } of INDEXES_CONFIG) {
      const coll = db.collection(collection);
      const indexes = await coll.listIndexes().toArray();
      console.log(`  ${collection}: ${indexes.length} index(es)`);
      indexes.forEach(idx => {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des index:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Fonction pour supprimer tous les index (utile pour le reset)
async function dropAllIndexes() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    
    for (const { collection } of INDEXES_CONFIG) {
      console.log(`🗑️  Suppression des index de: ${collection}`);
      const coll = db.collection(collection);
      
      try {
        await coll.dropIndexes();
        console.log(`✅ Index supprimés pour ${collection}`);
      } catch (error: any) {
        if (!error.message.includes('ns not found')) {
          console.warn(`⚠️  Erreur suppression ${collection}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Tous les index ont été supprimés !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Fonction pour afficher les index existants
async function listIndexes() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    
    for (const { collection } of INDEXES_CONFIG) {
      console.log(`\n📋 Index pour ${collection}:`);
      const coll = db.collection(collection);
      
      try {
        const indexes = await coll.listIndexes().toArray();
        if (indexes.length === 0) {
          console.log('  Aucun index trouvé');
        } else {
          indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            if (idx.textIndexVersion) {
              console.log(`    (Index de texte, version: ${idx.textIndexVersion})`);
            }
          });
        }
      } catch (error: any) {
        console.log(`  Collection n'existe pas ou erreur: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Gestion des arguments de ligne de commande
const command = process.argv[2];

switch (command) {
  case 'create':
    createIndexes();
    break;
  case 'drop':
    dropAllIndexes();
    break;
  case 'list':
    listIndexes();
    break;
  default:
    console.log(`
Usage: npm run setup-indexes [command]

Commands:
  create  - Créer tous les index nécessaires (par défaut)
  drop    - Supprimer tous les index existants
  list    - Lister tous les index existants

Exemples:
  npm run setup-indexes
  npm run setup-indexes create
  npm run setup-indexes drop
  npm run setup-indexes list
    `);
    createIndexes(); // Par défaut, créer les index
    break;
}