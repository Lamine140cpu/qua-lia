/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Réinitialisez votre mot de passe Qual'IA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Qual'IA</Text>
        <Heading style={h1}>Réinitialisation du mot de passe</Heading>
        <Text style={text}>
          Vous avez demandé à réinitialiser votre mot de passe sur Qual'IA.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </Text>
        <Button style={button} href={confirmationUrl}>
          Réinitialiser mon mot de passe
        </Button>
        <Text style={footer}>
          Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
          Votre mot de passe restera inchangé.
        </Text>
        <Text style={footer}>
          — L'équipe Qual'IA · Groupe Averreo
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Source Sans 3', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1e3a5f',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1e3a5f',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3c4257',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#1e3a5f',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8898aa', margin: '30px 0 0', lineHeight: '1.5' }
