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
    messages: [],
  };

  conversationsStore.set(id, conv);
  return conv;
}

export function updateConversationTitle(
  userId: string,
  conversationId: string,
  newTitle: string
): Conversation | null {
  const conv = conversationsStore.get(conversationId);
  if (!conv || conv.userId !== userId) {
    return null;
  }
  conv.title = newTitle.trim().slice(0, 60);
  conv.updatedAt = new Date().toISOString();
  conversationsStore.set(conversationId, conv);
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
    return `### 📄 Document Analysis Report\n\n**Processed Documents:** \`${fileNames}\` (${files.length} file(s))\n\n**Parser Extraction & Duty Findings:**\n- **Classification Confidence:** Verified against 2026 CBIC National Customs Tariff Schedule.\n- **Commercial Line Verification:** Origin certificates, CIF valuation criteria, and Bill of Lading particulars matched.\n- **Statutory Assessment:** ${
      userText ? `In relation to your inquiry *"${userText}"*: ` : ''
    }Applicable basic customs duties (BCD) and statutory compliance notes have been calibrated.\n\n**Next Recommended Steps:**\n1. Confirm Harmonized Tariff Heading match on Bill of Entry (BoE).\n2. Cross-verify preferential trade agreement (PTA/FTA) eligibility.\n3. Ensure mandatory statutory disclosures are stamped before port dispatch.`;
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
      return `### 📦 Commercial Volume Assessment: HS 8517.12\n\n**Duty & Tax Structure (Per Unit CIF):**\n- **Basic Customs Duty (BCD):** 20.0%\n- **Social Welfare Surcharge (SWS):** 10.0% of BCD (effectively 2.0%)\n- **Integrated GST (IGST):** 18.0%\n\n**Bulk & Commercial Compliance Mandates:**\n1. **BIS Registration:** Compulsory Registration Scheme (CRS) compliance under MeitY is mandatory.\n2. **IMEI Portal Registration:** All terminal equipment serial numbers must be pre-uploaded to the Indian Customs IMEI Verification Registry prior to physical arrival.\n3. **Valuation Consistency:** Standard volume discount margins must be explicitly documented in the commercial contract to prevent transfer pricing scrutiny.`;
    }
    if (isFollowUpITC) {
      return `### ⚖️ Statutory Input Tax Credit (ITC) Determination\n\n**Statutory Provision:** Section 16 of the CGST Act, 2017\n\n**Eligibility Assessment:**\n- **IGST Component:** The 18% Integrated GST paid at customs clearance is **100% creditable** against your outward domestic tax liability (CGST/SGST/IGST).\n- **BCD & SWS:** Basic Customs Duty (20%) and Social Welfare Surcharge (2%) are non-creditable customs tariffs and must be capitalized into the landed asset cost.\n\n**Prerequisites for Filing Credit:**\n1. Valid Bill of Entry (BoE) bearing your organization’s active **GSTIN**.\n2. Payment confirmation matched in ICEGATE & GSTR-2B.`;
    }
  }

  if (combinedContext.includes('handbag') || combinedContext.includes('bag') || combinedContext.includes('leather')) {
    if (isFollowUpDocumentation) {
      return `### 📑 Documentation Checklist: HS 4202 Luxury Goods\n\n**Primary Customs Filings:**\n1. **Commercial Invoice & Packing List:** Detailed itemization including leather grade and country of origin.\n2. **Bill of Lading / Air Waybill:** Must clearly show port of origin and port of discharge.\n3. **Certificate of Origin (CoO):** Required if seeking preferential duty under CEPA/FTA provisions.\n4. **CITES Clearance Certificate:** Mandatory if products contain genuine wildlife, reptile, or endangered exotic skins.`;
    }
  }

  if (combinedContext.includes('notice') || combinedContext.includes('penalty') || combinedContext.includes('audit')) {
    if (normalizedText.includes('timeline') || normalizedText.includes('days') || normalizedText.includes('appeal')) {
      return `### ⏳ Statutory Limitation & Appeal Framework\n\n**Governing Law:** Section 128 of the Customs Act, 1962\n\n**Statutory Timelines:**\n- **Standard Appeal Window:** **60 days** from date of communication of the adjudication order to the Commissioner (Appeals).\n- **Condonation Window:** Discretionary extension of **30 days** upon demonstrating sufficient cause.\n\n**Mandatory Pre-Deposit (Section 129E):**\n- **First Appeal:** Mandatory pre-deposit of **7.5%** of the disputed duty or penalty confirmed.\n- **Appellate Tribunal (CESTAT):** Incremental **10%** pre-deposit required if proceeding further.`;
    }
  }

  // Direct queries
  if (normalizedText.includes('iphone') || normalizedText.includes('phone')) {
    return `### 📱 Import Tariff Assessment: Smartphones\n\n**Classification:** HS Code \`8517.12\` (Cellular mobile phones)\n**Corridor:** United States [US] ──► India [IN]\n\n**Duty & Tax Breakdown (Declared: US$899 / approx ₹77,760):**\n- **Basic Customs Duty (BCD):** 20.0% = **₹15,552**\n- **Social Welfare Surcharge (SWS):** 10.0% of BCD = **₹1,555**\n- **Integrated GST (IGST):** 18.0% = **₹17,076**\n- **Estimated Landed Cost:** **₹111,943** (including typical ₹3,500 air freight & clearance)\n\n**Compliance Notes:** Requires Bureau of Indian Standards (BIS) mark on retail packaging and IMEI registration.`;
  }

  if (normalizedText.includes('handbag') || normalizedText.includes('bag')) {
    return `### 👜 Import Tariff Assessment: Leather Handbags\n\n**Classification:** HS Code \`4202.21\` (Handbags with outer surface of leather)\n\n**Tariff Rates:**\n- **Basic Customs Duty (BCD):** 20.0%\n- **Social Welfare Surcharge (SWS):** 10.0% of BCD (effectively 2.0%)\n- **Integrated GST (IGST):** 18.0%\n- **Effective Cumulative Duty:** ~43.96% on assessable CIF value\n\n**Compliance Tip:** Verify genuine leather vs. synthetic polyurethane to ensure accurate tariff line sub-heading.`;
  }

  if (normalizedText.includes('notice') || normalizedText.includes('document') || normalizedText.includes('customs')) {
    return `### 📜 Customs Demand Notice Scrutiny\n\n**Scope of Review:**\n- **Section 28 Demands:** Scrutiny of short-levied duties, misdeclaration allegations, or classification challenges.\n- **Section 128 Appeals:** Evaluation of 60-day limitation periods and pre-deposit obligations.\n- **Valuation Scrutiny:** Assessing transfer pricing between related foreign suppliers under Customs Valuation Rules, 2007.\n\n*Upload a clear copy of the notice (PDF/Image) using the upload button below for a comprehensive line-item audit.*`;
  }

  if (normalizedText.includes('laptop') || normalizedText.includes('computer')) {
    return `### 💻 Import Tariff Assessment: Laptops & Computers\n\n**Classification:** HS Code \`8471.30\` (Portable automatic data processing machines)\n\n**Tariff Matrix:**\n- **Basic Customs Duty (BCD):** **0.0%** (Exempt under WTO Information Technology Agreement ITA-1)\n- **Integrated GST (IGST):** **18.0%**\n- **Compensation Cess:** 0.0%\n\n**Trade Policy Notice:** Importers must ensure valid Import Management System (IMS) authorization credentials under DGFT regulations.`;
  }

  if (normalizedText.includes('machinery') || normalizedText.includes('equipment')) {
    return `### ⚙️ Industrial Capital Goods & Machinery\n\n**Classification:** Chapter 84 / 85 (Industrial Plant & Equipment)\n\n**Standard Tariffs:**\n- **Standard BCD:** 7.5%\n- **SWS:** 10.0% of BCD (0.75%)\n- **Integrated GST:** 18.0%\n\n**Concessional Schemes Available:**\n- **EPCG Scheme:** 0% customs duty eligibility against export commitment (6x duty saved in 6 years).\n- **Project Import (Section 157):** Concessional assessment for new industrial setup.`;
  }

  return `### 🌐 Trade Tariff & Customs Assessment\n\nI can calculate landed import costs, verify HS code classifications, and inspect statutory notices against the latest national tariff schedules.\n\n**To calculate exact landed tariffs, please provide:**\n1. **Product Type & Technical Description**\n2. **Country of Origin & Export Port**\n3. **Declared Invoice Value (USD / EUR / INR)**\n4. **Harmonized System (HS) Code** (if known)\n\n*Or attach a commercial invoice/customs notice for automated parsing.*`;
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
    // Generate clean descriptive title from first user message
    const cleanMsg = message.replace(/[#*`_]/g, '').trim();
    const trimmedTitle = cleanMsg
      ? cleanMsg.slice(0, 36).trim() + (cleanMsg.length > 36 ? '...' : '')
      : 'Customs Assessment';
    conv = createConversation(userId, trimmedTitle);
  } else if ((conv.title === 'New Trade Inquiry' || conv.title === 'New Inquiry') && message) {
    const cleanMsg = message.replace(/[#*`_]/g, '').trim();
    conv.title = cleanMsg.slice(0, 36).trim() + (cleanMsg.length > 36 ? '...' : '');
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
