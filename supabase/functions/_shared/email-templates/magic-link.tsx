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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre lien de connexion Qual'IA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Qual'IA</Text>
        <Heading style={h1}>Connexion rapide</Heading>
        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour vous connecter à Qual'IA.
          Ce lien expirera dans quelques minutes.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Me connecter
        </Button>
        <Text style={footer}>
          Si vous n'avez pas demandé ce lien, ignorez simplement cet email.
        </Text>
        <Text style={footer}>
          — L'équipe Qual'IA · Groupe Averreo
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
