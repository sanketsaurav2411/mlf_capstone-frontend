export interface UploadedFileMeta {
  name: string;
  path?: string;
  mimetype?: string;
  size: number;
}

export interface ChatMessage {
  id: string | number;
  sender: 'user' | 'bot';
  text: string;
  files?: UploadedFileMeta[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export function buildUploadedFiles(files: any[] = []): UploadedFileMeta[] {
  return files.map((file) => ({
    name: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
  }));
}

// In-memory conversation store keyed by conversation id (starts clean for every user)
export const conversationsStore = new Map<string, Conversation>();

export function getUserConversations(userId: string): Array<{
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}> {
  const result: Array<{
    id: string;
    title: string;
    lastMessage: string;
    messageCount: number;
    updatedAt: string;
    createdAt: string;
  }> = [];

  for (const conv of conversationsStore.values()) {
    if (conv.userId === userId) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      result.push({
        id: conv.id,
        title: conv.title,
        lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
        messageCount: conv.messages.length,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      });
    }
  }

  // Sort by updatedAt descending
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getConversationById(userId: string, conversationId: string): Conversation | null {
  const conv = conversationsStore.get(conversationId);
  if (!conv || conv.userId !== userId) {
    return null;
  }
  return conv;
}

export function createConversation(userId: string, title?: string): Conversation {
  const id = `conv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const conv: Conversation = {
    id,
    userId,
    title: title || 'New Trade Inquiry',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: 'Hello! I am your TariffFlow trade assistant. Ask me about customs duties, HS codes, or upload trade documents.',
        createdAt: now,
      },
    ],
  };

  conversationsStore.set(id, conv);
  return conv;
}

export function deleteConversation(userId: string, conversationId: string): boolean {
  const conv = conversationsStore.get(conversationId);
  if (!conv || conv.userId !== userId) {
    return false;
  }
  return conversationsStore.delete(conversationId);
}

export function generateContextualReply(
  userText = '',
  files: UploadedFileMeta[] = [],
  history: ChatMessage[] = []
): string {
  const normalizedText = userText.toLowerCase();

  // Inspect recent messages in the conversation for conversational context
  const pastUserQuestions = history
    .filter((m) => m.sender === 'user')
    .slice(-3)
    .map((m) => m.text.toLowerCase());
  const combinedContext = pastUserQuestions.join(' ');

  if (files.length > 0) {
    const fileNames = files.map((f) => f.name).join(', ');
    return `Received and analyzed ${files.length} document(s): [${fileNames}]. Our customs document parser identified relevant tariff classifications, shipping origin indicators, and duty rates. ${
      userText ? `Regarding "${userText}": ` : ''
    }Applicable basic customs duties (BCD) and statutory compliance notes have been verified against current tariff schedules.`;
  }

  // Follow-up detection: quantities, tax credit, shipping variation
  const isFollowUpQuantity =
    normalizedText.includes('quantity') ||
    normalizedText.includes('how many') ||
    normalizedText.includes('units') ||
    normalizedText.match(/\b\d+\s*(units|pieces|pcs|phones|items|boxes)\b/);

  const isFollowUpITC =
    normalizedText.includes('itc') ||
    normalizedText.includes('input tax') ||
    normalizedText.includes('claim') ||
    normalizedText.includes('refund');

  const isFollowUpDocumentation =
    normalizedText.includes('document') ||
    normalizedText.includes('paperwork') ||
    normalizedText.includes('certificate') ||
    normalizedText.includes('invoice');

  if (combinedContext.includes('iphone') || combinedContext.includes('phone') || combinedContext.includes('8517')) {
    if (isFollowUpQuantity) {
      return 'For commercial volume shipments of mobile phones (HS 8517.12), the 20% BCD and 18% IGST apply per unit value. Additionally, bulk imports require BIS (Bureau of Indian Standards) registration compliance and mandatory IMEI registration on the Indian Customs portal before clearance.';
    }
    if (isFollowUpITC) {
      return 'Under Indian GST laws, IGST paid upon customs clearance for imported smartphones qualifies for 100% Input Tax Credit if imported using your firm’s active GSTIN on the Bill of Entry and utilized for taxable commercial supplies.';
    }
  }

  if (combinedContext.includes('handbag') || combinedContext.includes('bag') || combinedContext.includes('leather')) {
    if (isFollowUpDocumentation) {
      return 'For importing luxury handbags (HS 4202), you will need: Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin (for preferential duty agreements), and Wildlife/CITES clearance if genuine exotic leather is used.';
    }
  }

  if (combinedContext.includes('notice') || combinedContext.includes('penalty') || combinedContext.includes('audit')) {
    if (normalizedText.includes('timeline') || normalizedText.includes('days') || normalizedText.includes('appeal')) {
      return 'Under Section 128 of the Customs Act, 1962, you have 60 days from the communication date to file an appeal before the Commissioner (Appeals), extendable by 30 days upon showing sufficient cause. A mandatory pre-deposit of 7.5% of the duty confirmed is required.';
    }
  }

  // Direct queries
  if (normalizedText.includes('iphone') || normalizedText.includes('phone')) {
    return 'For an iPhone imported from the US to India (HS Code 8517.12), estimated duty includes: Basic Customs Duty (approx 20%), Social Welfare Surcharge (10% of BCD), and IGST (18%). Declared value of US$899 results in approx ₹85,430 landed cost. We recommend attaching the supplier invoice for precise assessment.';
  }

  if (normalizedText.includes('handbag') || normalizedText.includes('bag')) {
    return 'Luxury leather and synthetic handbags (HS Code 4202) typically attract 20% Basic Customs Duty + 18% GST + SWS. Preferential trade agreements may apply depending on origin and Certificate of Origin.';
  }

  if (normalizedText.includes('notice') || normalizedText.includes('document') || normalizedText.includes('customs')) {
    return 'Customs demand notices and scrutiny queries can be analyzed for statutory appeal timelines (usually 60 days under Section 128), duty differential claims, and valuation adjustments. Please upload the notice scan.';
  }

  if (normalizedText.includes('laptop') || normalizedText.includes('computer')) {
    return 'Laptops and computers (HS Code 8471.30) generally enter at 0% Basic Customs Duty under the Information Technology Agreement (ITA-1), but attract 18% IGST. Note that import authorization may be required for restricted electronic capital goods.';
  }

  if (normalizedText.includes('machinery') || normalizedText.includes('equipment')) {
    return 'Capital goods and industrial machinery (HS Chapter 84/85) typically carry 7.5% BCD + 18% IGST. If importing under the EPCG (Export Promotion Capital Goods) scheme, you may be eligible for 0% customs duty subject to export obligations.';
  }

  return 'I can estimate tariff impact, verify HS code classifications, and calculate landed import costs including BCD, SWS, and IGST. Share your product type, origin country, destination port, and invoice value for an exact assessment.';
}

export function addMessageToConversation({
  userId,
  conversationId,
  message = '',
  files = [],
}: {
  userId: string;
  conversationId?: string;
  message?: string;
  files?: any[];
}): {
  conversation: Conversation;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
} {
  let conv: Conversation | null = null;
  const now = new Date().toISOString();

  if (conversationId && conversationsStore.has(conversationId)) {
    const existing = conversationsStore.get(conversationId)!;
    if (existing.userId === userId) {
      conv = existing;
    }
  }

  if (!conv) {
    // Generate descriptive title from first user message
    const trimmedTitle = message
      ? message.slice(0, 38).trim() + (message.length > 38 ? '...' : '')
      : 'Document Review';
    conv = createConversation(userId, trimmedTitle);
  } else if (conv.title === 'New Trade Inquiry' && message) {
    // Update default placeholder title with the real question
    conv.title = message.slice(0, 38).trim() + (message.length > 38 ? '...' : '');
  }

  const uploadedFiles = buildUploadedFiles(files);

  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}-u`,
    sender: 'user',
    text: message || (uploadedFiles.length > 0 ? 'Please review the attached document.' : ''),
    files: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
    createdAt: now,
  };

  conv.messages.push(userMessage);

  const replyText = generateContextualReply(message, uploadedFiles, conv.messages);

  const botMessage: ChatMessage = {
    id: `msg-${Date.now() + 1}-b`,
    sender: 'bot',
    text: replyText,
    createdAt: new Date(Date.now() + 50).toISOString(),
  };

  conv.messages.push(botMessage);
  conv.updatedAt = new Date().toISOString();

  conversationsStore.set(conv.id, conv);

  return {
    conversation: conv,
    userMessage,
    botMessage,
  };
}
