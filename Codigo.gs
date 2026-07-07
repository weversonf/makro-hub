/**
 * Script de Integração All in Makro 2026 - v2.3
 * Desenvolvido para: Weverson - Makro Engenharia
 */

function doGet(e) {
  const data = fetchCompleteData();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  
  if (action === "survey") {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("NPS - MKE");
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({result: "error", message: "Aba NPS - MKE não encontrada"}))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const newRow = [];
      newRow[0] = new Date();                            // A: Carimbo de data/hora
      newRow[1] = e.parameter["Nome do Contrato"];       // B: Contrato
      newRow[2] = "Não Definida";                        // C: Unidade (Padrão)
      newRow[3] = "";                                    // D
      newRow[4] = "";                                    // E
      newRow[5] = e.parameter["Nome do Responsável"];    // F: Responsável
      newRow[6] = e.parameter["Mes Referente"];          // G: Mês (Ex: Jan 26)
      
      for (let i = 7; i < 19; i++) { newRow[i] = ""; }
      
      newRow[19] = e.parameter["Nota"];                  // T: Nota (Índice 19)
      newRow[20] = "";                                   // U
      newRow[21] = e.parameter["Feedback"];              // V: Feedback (Índice 21)

      sheet.appendRow(newRow);
      
      return ContentService.createTextOutput(JSON.stringify({result: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({result: "error", message: error.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

/**
 * Função principal que consolida todos os dados da planilha
 */
function fetchCompleteData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // -- A: Puxar Respostas MKE --
  const sheetMKE = ss.getSheetByName("NPS - MKE");
  const dataMKE = sheetMKE ? sheetMKE.getDataRange().getDisplayValues().slice(1)
    .filter(row => row[6] && row[6] !== "")
    .map(row => ({
      empresa: "MKE",
      data: row[0],
      contrato: row[1],           // Coluna B - Número do contrato
      numContrato: row[1],        // Coluna B - Número do contrato
      nomeContrato: row[4],       // Coluna E - Nome do contrato
      unidade: row[2],            // Coluna C
      responsavel: row[5],        // Coluna F
      mes: row[6],                // Coluna G
      nota: row[19],              // Coluna T
      feedback: row[21],          // Coluna V
      classificacao: row[24],     // Coluna Y
      cliente: row[28]            // Coluna AC - Nome do cliente
    })) : [];

  // -- B: Puxar Respostas MKT --
  const sheetMKT = ss.getSheetByName("NPS - MKT");
  const dataMKT = sheetMKT ? sheetMKT.getDataRange().getDisplayValues().slice(1)
    .filter(row => row[3] && row[3] !== "")
    .map(row => ({
      empresa: "MKT",
      data: row[0],
      unidade: row[1],            // Coluna B
      responsavel: row[2],        // Coluna C
      mes: row[3],                // Coluna D
      nota: row[4],               // Coluna E
      feedback: row[5]            // Coluna F
    })) : [];

  // -- C: Puxar Base de Contratos (Aderência) --
  const sheetBase = ss.getSheetByName("RESUMO");
  const metasAderencia = {};
  if (sheetBase) {
    const baseData = sheetBase.getDataRange().getDisplayValues().slice(1);
    baseData.forEach(row => {
      const mes = row[0];     
      const realizar = parseInt(row[1]) || 0; 
      if (mes) {
        metasAderencia[mes] = { MKE: realizar, MKT: 0, Total: realizar };
      }
    });
  }

  // -- D: Lista de Contratos para o Form --
  const sheetContratos = ss.getSheetByName("Contratos");
  const listaContratos = sheetContratos ? sheetContratos.getDataRange().getDisplayValues().slice(1)
    .filter(row => row[0])
    .map(row => ({
      numero: row[2], 
      exibicao: row[0], 
      cliente: row[3]  
    })) : [];

  return {
    result: "success",
    metrics: {
      baseDados: dataMKE.concat(dataMKT),
      metasAderencia: metasAderencia,
      listaContratos: listaContratos
    }
  };
}
