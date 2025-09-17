import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatLayoutComponent } from './chat-layout/chat-layout.component';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { MessageAreaComponent } from './message-area/message-area.component';
import { MessageInputComponent } from './message-input/message-input.component';
import { MessageBubbleComponent } from './components/message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from './components/typing-indicator/typing-indicator.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChatRoutingModule,
    ChatLayoutComponent,
    ConversationListComponent,
    MessageAreaComponent,
    MessageInputComponent,
    MessageBubbleComponent,
    TypingIndicatorComponent
  ]
})
export class ChatModule { }
