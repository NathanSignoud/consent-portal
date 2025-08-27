// scripts/createTextIndex.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createTextIndex() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI non définie');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('icnpinterventions');

    // Vérifier le nombre de documents
    const docCount = await collection.countDocuments();
    console.log(`📊 Documents ICNP trouvés: ${docCount}`);

    if (docCount === 0) {
      console.log('❌ Aucune donnée ICNP trouvée dans la collection');
      process.exit(1);
    }

    // Vérifier la structure des documents
    console.log('🔍 Vérification de la structure des documents...');
    const sampleDoc = await collection.findOne({});
    if (sampleDoc) {
      console.log('📋 Exemple de document:');
      console.log(`  - _id: ${sampleDoc._id}`);
      console.log(`  - icnp_id: ${sampleDoc.icnp_id}`);
      console.log(`  - axis: ${sampleDoc.axis}`);
      console.log(`  - term.fr: ${sampleDoc.term?.fr || 'N/A'}`);
      console.log(`  - term.en: ${sampleDoc.term?.en || 'N/A'}`);
    }

    // Vérifier les index existants
    console.log('📋 Index existants:');
    try {
      const existingIndexes = await collection.listIndexes().toArray();
      existingIndexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });

      // Vérifier si l'index de texte existe déjà
      const textIndexExists = existingIndexes.some(idx => 
        idx.key && (idx.key._fts === 'text' || JSON.stringify(idx.key).includes('text'))
      );

      if (textIndexExists) {
        console.log('✅ Index de texte existe déjà !');
        
        // Tester la recherche
        console.log('🧪 Test de recherche textuelle...');
        const testResults = await collection.find(
          { $text: { $search: "toilette" } },
          { score: { $meta: "textScore" } }
        ).limit(3).toArray();
        
        console.log(`✅ Test réussi ! ${testResults.length} résultat(s) trouvé(s)`);
        testResults.forEach((result, i) => {
          console.log(`  ${i + 1}. ${result.term?.fr || 'N/A'} (Score: ${result.score?.toFixed(2) || 'N/A'})`);
        });

        console.log('\n🎉 L\'index de texte fonctionne déjà correctement !');
        return;
      }
    } catch (error) {
      console.log('  Aucun index trouvé ou erreur lors de la lecture');
    }

    // Créer l'index de texte
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
            'term.fr': 10,    // Priorité max pour termes français
            'term.en': 8,     // Priorité haute pour termes anglais
            'description.fr': 5,  // Priorité moyenne pour descriptions françaises
            'description.en': 3   // Priorité basse pour descriptions anglaises
          }
        }
      );
      console.log('✅ Index de texte créé avec succès !');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('ℹ️  Index de texte existe déjà');
      } else {
        console.error('❌ Erreur lors de la création de l\'index:', error.message);
        throw error;
      }
    }

    // Créer quelques index supplémentaires utiles
    console.log('🔨 Création des index supplémentaires...');
    
    const additionalIndexes = [
      { spec: { icnp_id: 1 }, name: 'icnp_id_index' },
      { spec: { axis: 1 }, name: 'axis_index' },
      { spec: { axis: 1, icnp_id: 1 }, name: 'axis_icnp_compound' }
    ];

    for (const { spec, name } of additionalIndexes) {
      try {
        await collection.createIndex(spec, { name });
        console.log(`✅ Index ${name} créé`);
      } catch (error: any) {
        if (error.code === 85) {
          console.log(`ℹ️  Index ${name} existe déjà`);
        } else {
          console.warn(`⚠️  Erreur création ${name}: ${error.message}`);
        }
      }
    }

    // Test de validation de la recherche
    console.log('🧪 Tests de validation...');
    
    const searchTests = [
      'toilette',
      'médicament', 
      'administrer',
      'surveiller',
      'douleur'
    ];
    
    for (const term of searchTests) {
      try {
        const results = await collection.find(
          { $text: { $search: term } },
          { score: { $meta: "textScore" }, icnp_id: 1, 'term.fr': 1 }
        ).limit(3).toArray();
        
        console.log(`  "${term}": ${results.length} résultat(s)`);
        results.forEach((result, i) => {
          console.log(`    ${i + 1}. [${result.icnp_id}] ${result.term?.fr || 'N/A'}`);
        });
      } catch (error: any) {
        console.error(`❌ Erreur test "${term}": ${error.message}`);
      }
    }

    // Affichage final des index
    console.log('\n📊 Index finaux créés:');
    const finalIndexes = await collection.listIndexes().toArray();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log(`\n🎉 Index créés avec succès sur ${docCount} interventions ICNP !`);
    console.log('🚀 Votre serveur peut maintenant effectuer des recherches textuelles');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Lancer la création d'index
createTextIndex();