import { inject, injectable, } from 'inversify';
import { ServiceIdentifiers } from '../../container/ServiceIdentifiers';

import * as ESTree from 'estree';

import { TIdentifierNamesGeneratorFactory } from '../../types/container/generators/TIdentifierNamesGeneratorFactory';
import { TStringArrayIndexesType } from '../../types/options/TStringArrayIndexesType';
import { TStringArrayIndexNodeFactory } from '../../types/container/custom-nodes/string-array-index-nodes/TStringArrayIndexNodeFactory';

import { ICustomCodeHelperFormatter } from '../../interfaces/custom-code-helpers/ICustomCodeHelperFormatter';
import { IOptions } from '../../interfaces/options/IOptions';
import { IRandomGenerator } from '../../interfaces/utils/IRandomGenerator';

import { StringArrayIndexesType } from '../../enums/node-transformers/string-array-transformers/StringArrayIndexesType';
import { StringArrayIndexNode } from '../../enums/custom-nodes/string-array-index-nodes/StringArrayIndexNode';

import { AbstractCustomNode } from '../AbstractCustomNode';
import { NodeFactory } from '../../node/NodeFactory';
import { NodeMetadata } from '../../node/NodeMetadata';
import { NodeUtils } from '../../node/NodeUtils';

@injectable()
export abstract class AbstractStringArrayCallNode extends AbstractCustomNode {
    /**
     * @type {Map<TStringArrayIndexesType, StringArrayIndexNode>}
     */
    private static readonly stringArrayIndexNodesMap: Map<TStringArrayIndexesType, StringArrayIndexNode> = new Map([
        [StringArrayIndexesType.HexadecimalNumber, StringArrayIndexNode.StringArrayHexadecimalNumberIndexNode],
        [StringArrayIndexesType.HexadecimalNumericString, StringArrayIndexNode.StringArrayHexadecimalNumericStringIndexNode]
    ]);

    /**
     * @type {TStringArrayIndexNodeFactory}
     */
    private readonly stringArrayIndexNodeFactory: TStringArrayIndexNodeFactory;

    /**
     * @param {TIdentifierNamesGeneratorFactory} identifierNamesGeneratorFactory
     * @param {TStringArrayIndexNodeFactory} stringArrayIndexNodeFactory
     * @param {ICustomCodeHelperFormatter} customCodeHelperFormatter
     * @param {IRandomGenerator} randomGenerator
     * @param {IOptions} options
     */
    protected constructor (
        @inject(ServiceIdentifiers.Factory__IIdentifierNamesGenerator)
            identifierNamesGeneratorFactory: TIdentifierNamesGeneratorFactory,
        @inject(ServiceIdentifiers.Factory__IStringArrayIndexNode)
            stringArrayIndexNodeFactory: TStringArrayIndexNodeFactory,
        @inject(ServiceIdentifiers.ICustomCodeHelperFormatter) customCodeHelperFormatter: ICustomCodeHelperFormatter,
        @inject(ServiceIdentifiers.IRandomGenerator) randomGenerator: IRandomGenerator,
        @inject(ServiceIdentifiers.IOptions) options: IOptions
    ) {
        super(
            identifierNamesGeneratorFactory,
            customCodeHelperFormatter,
            randomGenerator,
            options
        );

        this.stringArrayIndexNodeFactory = stringArrayIndexNodeFactory;
    }

    /**
     * @param {number} index
     * @returns {Expression}
     */
    protected getStringArrayIndexNode (index: number): ESTree.Expression {
        const isPositive: boolean = index >= 0;
        const normalizedIndex: number = Math.abs(index);

        const stringArrayCallsIndexType: TStringArrayIndexesType = this.randomGenerator
            .getRandomGenerator()
            .pickone(this.options.stringArrayIndexesType);
        const stringArrayIndexNodeName: StringArrayIndexNode | null = AbstractStringArrayCallNode.stringArrayIndexNodesMap.get(stringArrayCallsIndexType) ?? null;

        if (!stringArrayIndexNodeName) {
            throw new Error('Invalid string array index node name');
        }

        const stringArrayCallIndexNode: ESTree.Expression = this.stringArrayIndexNodeFactory(stringArrayIndexNodeName)
            .getNode(normalizedIndex);

        NodeMetadata.set(stringArrayCallIndexNode, { replacedLiteral: true });

        const hexadecimalNode: ESTree.Expression = isPositive
            ? stringArrayCallIndexNode
            : NodeFactory.unaryExpressionNode(
                '-',
                stringArrayCallIndexNode
            );

        NodeUtils.parentizeAst(hexadecimalNode);
        
        return hexadecimalNode;
    }

    /**
     * @param {string} decodeKey
     * @returns {Literal}
     */
    protected getRc4KeyLiteralNode (decodeKey: string): ESTree.Literal {
        const rc4KeyLiteralNode: ESTree.Literal = NodeFactory.literalNode(decodeKey);

        NodeMetadata.set(rc4KeyLiteralNode, { replacedLiteral: true });

        return rc4KeyLiteralNode;
    }
}
