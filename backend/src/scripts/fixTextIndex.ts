// scripts/fixTextIndex.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIcnpTextIndex() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI non définie');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('icnpinterventions');

    console.log('🔍 Vérification de la collection icnpinterventions...');
    
    // Vérifier si la collection existe
    const collections = await db.listCollections({ name: 'icnpinterventions' }).toArray();
    if (collections.length === 0) {
      console.log('⚠️  Collection icnpinterventions n\'existe pas');
      console.log('📝 Création de la collection...');
      await db.createCollection('icnpinterventions');
    }

    // Vérifier les index existants
    console.log('📋 Index existants:');
    try {
      const existingIndexes = await collection.listIndexes().toArray();
      existingIndexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } catch (error) {
      console.log('  Aucun index trouvé');
    }

    // Créer l'index de texte pour la recherche ICNP
    console.log('🔨 Création de l\'index de texte...');
    
    try {
      await collection.createIndex(
        {
          'term.fr': 'text',
          'term.en': 'text',
          'description.fr': 'text',
          'description.en': 'text'
        },
        {
          name: 'icnp_text_search',
          default_language: 'french',
          weights: {
            'term.fr': 10,
            'term.en': 8,
            'description.fr': 5,
            'description.en': 3
          }
        }
      );
      console.log('✅ Index de texte créé avec succès !');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('ℹ️  Index de texte existe déjà');
      } else {
        throw error;
      }
    }

    // Créer d'autres index utiles pour ICNP
    console.log('🔨 Création des autres index ICNP...');
    
    const otherIndexes = [
      { spec: { icnp_id: 1 }, name: 'icnp_id_unique', options: { unique: true } },
      { spec: { axis: 1 }, name: 'axis_index' },
      { spec: { axis: 1, icnp_id: 1 }, name: 'axis_icnp_compound' }
    ];

    for (const { spec, name, options = {} } of otherIndexes) {
      try {
        await collection.createIndex(spec, { name, ...options });
        console.log(`✅ Index ${name} créé`);
      } catch (error: any) {
        if (error.code === 85) {
          console.log(`ℹ️  Index ${name} existe déjà`);
        } else {
          console.warn(`⚠️  Erreur création ${name}: ${error.message}`);
        }
      }
    }

    // Tester la recherche textuelle
    console.log('🧪 Test de la recherche textuelle...');
    try {
      const testResults = await collection.find(
        { $text: { $search: "toilette" } },
        { score: { $meta: "textScore" } }
      ).limit(5).toArray();
      
      console.log(`✅ Test réussi ! ${testResults.length} résultat(s) trouvé(s)`);
      if (testResults.length > 0) {
        console.log('  Exemples:');
        testResults.forEach((result, i) => {
          console.log(`    ${i + 1}. ${result.term?.fr || 'N/A'} (Score: ${result.score?.toFixed(2) || 'N/A'})`);
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
    }

    // Vérification finale
    console.log('\n📊 Index finaux:');
    const finalIndexes = await collection.listIndexes().toArray();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.textIndexVersion) {
        console.log(`    (Index de texte, version: ${idx.textIndexVersion})`);
      }
    });

    console.log('\n🎉 Réparation terminée avec succès !');
    console.log('🚀 Vous pouvez maintenant redémarrer votre serveur');

  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Lancer la réparation
fixIcnpTextIndex();