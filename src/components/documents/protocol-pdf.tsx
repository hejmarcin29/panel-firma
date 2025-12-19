import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Rejestracja czcionek (opcjonalne, tutaj używamy standardowych)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  vatSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  vatText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signatures: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  signatureLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    textAlign: 'center',
    color: '#999',
  },
  legalText: {
    marginTop: 20,
    fontSize: 10,
    fontStyle: 'italic',
  },
});

interface ProtocolDocumentProps {
  montageId: string;
  contractNumber: string;
  contractDate: string;
  clientName: string;
  installerName: string;
  location: string;
  date: string;
  isHousingVat: boolean;
  clientSignatureUrl: string;
  installerSignatureUrl: string;
}

export const ProtocolDocument = ({
  contractNumber,
  contractDate,
  clientName,
  installerName,
  location,
  date,
  isHousingVat,
  clientSignatureUrl,
  installerSignatureUrl,
}: ProtocolDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text>Protokół zakończenia robót wykończeniowych</Text>
        <Text style={styles.logo}>PRIME PODŁOGA</Text>
      </View>

      {/* Meta Data */}
      <View style={styles.section}>
        <Text>Sporządzony dnia {date} r. w {location}</Text>
      </View>

      {/* Subject */}
      <View style={styles.section}>
        <Text>
          w sprawie odbioru montażu paneli podłogowych Primepodloga.pl wykonywanej na podstawie
          oferty/umowy nr {contractNumber || '_______'} z dnia {contractDate || '_______'}
        </Text>
      </View>

      {/* VAT Statement */}
      <View style={styles.vatSection}>
        <Text style={styles.vatText}>
          dom jednorodzinny do 300m2 lub mieszkanie do 150m2: {isHousingVat ? 'TAK' : 'NIE'}
        </Text>
      </View>

      {/* Commission */}
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Komisja w Składzie:</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Przedstawiciel Zamawiającego:</Text>
          <Text style={styles.value}>{clientName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Przedstawiciel Wykonawcy:</Text>
          <Text style={styles.value}>{installerName}</Text>
        </View>
      </View>

      {/* Legal Clause */}
      <View style={styles.legalText}>
        <Text>
          Podpis obu stron jednoznacznie oznacza, że praca została wykonana zgodnie z ustaleniami,
          a Zamawiający nie wnosi zastrzeżeń co do jakości wykonanych prac oraz użytych materiałów.
        </Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatures}>
        <View style={styles.signatureBox}>
          <Text style={{ marginBottom: 10 }}>Przedstawiciel Zamawiającego:</Text>
          {clientSignatureUrl ? (
            <Image src={clientSignatureUrl} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60, borderBottomWidth: 1, width: 150 }} />
          )}
          <Text style={styles.signatureLabel}>(Podpis Klienta)</Text>
        </View>

        <View style={styles.signatureBox}>
          <Text style={{ marginBottom: 10 }}>Przedstawiciel Wykonawcy:</Text>
          {installerSignatureUrl ? (
            <Image src={installerSignatureUrl} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60, borderBottomWidth: 1, width: 150 }} />
          )}
          <Text style={styles.signatureLabel}>(Podpis Montażysty)</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Dokument wygenerowany elektronicznie w systemie Prime Podłoga.
      </Text>
    </Page>
  </Document>
);
